#!/usr/bin/env python3
"""Opt-in Windows real-model trial on synthetic, task-owned local services.

Does not install models, stop Docker, alter the main checkout, or reuse a database.
The caller supplies an isolated exact checkout and a native-ACL-protected private
run directory. Raw process logs and credentials stay in that private directory.
"""
import argparse
import ctypes
import json
import os
from pathlib import Path
import re
import secrets
import socket
import struct
import subprocess
import sys
import threading
import time
import urllib.request


class MemoryStatus(ctypes.Structure):
    _fields_ = [("length", ctypes.c_ulong), ("load", ctypes.c_ulong),
                ("total_phys", ctypes.c_ulonglong), ("avail_phys", ctypes.c_ulonglong),
                ("total_page", ctypes.c_ulonglong), ("avail_page", ctypes.c_ulonglong),
                ("total_virtual", ctypes.c_ulonglong), ("avail_virtual", ctypes.c_ulonglong),
                ("extended", ctypes.c_ulonglong)]


def memory():
    state = MemoryStatus()
    state.length = ctypes.sizeof(state)
    if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(state)):
        raise RuntimeError("memory_measurement_unavailable")
    return state.avail_phys // (1024 * 1024), state.avail_page // (1024 * 1024)



def owns_listener(pid, port=11434):
    """Check Windows' IPv4 listener table; do not infer ownership from HTTP content."""
    size = ctypes.c_ulong(0)
    api = ctypes.windll.iphlpapi.GetExtendedTcpTable
    result = api(None, ctypes.byref(size), False, 2, 3, 0)
    if result not in (0, 122):
        raise RuntimeError("listener_ownership_unavailable")
    for _ in range(3):
        data = ctypes.create_string_buffer(size.value)
        result = api(data, ctypes.byref(size), False, 2, 3, 0)
        if result == 122:
            continue
        if result:
            raise RuntimeError("listener_ownership_unavailable")
        raw = data.raw
        count = struct.unpack_from("<I", raw)[0]
        found = []
        for index in range(count):
            state, address, local_port, _, _, owner = struct.unpack_from("<6I", raw, 4 + index * 24)
            if socket.ntohs(local_port & 65535) == port:
                found.append((socket.inet_ntoa(struct.pack("<I", address)), owner))
        return found == [("127.0.0.1", pid)]
    raise RuntimeError("listener_ownership_unavailable")


def free_port():
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return probe.getsockname()[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--playwright-root", type=Path, required=True)
    parser.add_argument("--harness", type=Path, required=True)
    parser.add_argument("--expected-commit", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--ollama", type=Path, required=True)
    parser.add_argument("--models-dir", type=Path, required=True)
    parser.add_argument("--pg-bin", type=Path, default=Path(r"C:\Program Files\PostgreSQL\17\bin"))
    args = parser.parse_args()
    if sys.platform != "win32":
        raise RuntimeError("native_windows_required")
    root, run_dir = args.repo.resolve(), args.run_dir.resolve()
    private = run_dir / "private"
    if not private.is_dir() or (root / ".git").exists() is False:
        raise RuntimeError("isolated_repository_and_private_directory_required")
    head = subprocess.check_output(["git", "-C", str(root), "rev-parse", "HEAD"], text=True).strip()
    if head != args.expected_commit:
        raise RuntimeError("unexpected_source_revision")
    if subprocess.check_output(["git", "-C", str(root), "status", "--porcelain"], text=True).strip():
        raise RuntimeError("isolated_checkout_must_be_clean")
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 11434))  # Never hijack an owner's model service.
    if not args.ollama.is_file() or not args.models_dir.is_dir() or not args.harness.is_file():
        raise RuntimeError("installed_runtime_models_and_harness_required")
    if not (args.playwright_root / "node_modules/playwright/package.json").is_file():
        raise RuntimeError("existing_playwright_required")
    if not (root / "frontend/.next/BUILD_ID").is_file():
        raise RuntimeError("production_frontend_build_required")

    owned, handles = [], []
    report = {"sourceCommit": head, "mode": "synthetic real-model Windows validation", "passed": False}
    stage = "preflight"
    pressure = threading.Event()
    finished = threading.Event()
    minimum_free = [memory()[0]]
    pg_started = False
    model = None
    guard_reason = [None]
    pgdata = private / "postgres"
    if pgdata.exists():
        raise RuntimeError("new_task_owned_cluster_required")
    clean_base = dict(os.environ)
    clean_base.update(TEMP=str(run_dir / "temp"), TMP=str(run_dir / "temp"),
                      PYTHONDONTWRITEBYTECODE="1", NODE_USE_ENV_PROXY="0",
                      NO_PROXY="127.0.0.1,localhost,::1", no_proxy="127.0.0.1,localhost,::1")

    def stop_process(process):
        if process.poll() is None:
            subprocess.run(["taskkill.exe", "/PID", str(process.pid), "/T", "/F"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15, check=False)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=10)

    def start(name, command, env, cwd=root):
        if pressure.is_set():
            raise RuntimeError("memory_guard_triggered")
        out = open(private / (name + ".stdout.log"), "xb")
        err = open(private / (name + ".stderr.log"), "xb")
        handles.extend((out, err))
        process = subprocess.Popen([str(v) for v in command], cwd=cwd, env=env,
                                   stdout=out, stderr=err, stdin=subprocess.DEVNULL,
                                   creationflags=subprocess.CREATE_NO_WINDOW)
        owned.append(process)
        return process

    def command(name, argv, env, timeout=60):
        process = start(name, argv, env)
        try:
            code = process.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            stop_process(process)
            raise RuntimeError("bounded_command_timeout") from None
        if code:
            raise RuntimeError("bounded_command_failed")
        return (private / (name + ".stdout.log")).read_text(encoding="utf-8-sig")

    def get(url):
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(url, timeout=2) as response:
            return json.load(response)

    def ready(url, process, timeout=60):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if process.poll() is not None or pressure.is_set():
                raise RuntimeError("task_service_failed")
            try:
                value = get(url)
                if process.poll() is not None:
                    raise RuntimeError("task_service_failed")
                return value
            except (OSError, ValueError):
                time.sleep(.1)
        raise RuntimeError("readiness_timeout")

    def watchdog():
        deadline = time.monotonic() + 480
        while not finished.wait(.2):
            try:
                physical, virtual = memory()
                minimum_free[0] = min(minimum_free[0], physical)
                unsafe = physical < 768 or virtual < 2048
                if unsafe:
                    guard_reason[0] = "memory"
                elif time.monotonic() > deadline:
                    unsafe = True
                    guard_reason[0] = "deadline"
                elif model.poll() is not None or not owns_listener(model.pid):
                    unsafe = True
                    guard_reason[0] = "runtime_ownership"
            except Exception:
                unsafe = True
                guard_reason[0] = "measurement"
            if unsafe:
                pressure.set()
                for process in reversed(list(owned)):
                    try:
                        stop_process(process)
                    except Exception:
                        pass
                return

    try:
        python = Path(sys.executable)
        node = Path(r"C:\Program Files\nodejs\node.exe")
        helper = root / "backend/AuthorityCredentialFiles/bin/Release/net10.0/AuthorityCredentialFiles.dll"
        fixtures = private / "fixtures.json"
        command("private-parent", ["dotnet", helper, "inspect-parent", fixtures], clean_base)
        stage = "database_init"
        password = secrets.token_urlsafe(32)
        pwfile = private / "database-password.txt"
        with pwfile.open("x", encoding="utf-8") as stream:
            stream.write(password)
        pgport, backend_port, front_port = free_port(), free_port(), free_port()
        if len({pgport, backend_port, front_port, 11434}) != 4:
            raise RuntimeError("distinct_test_ports_required")
        db_env = dict(clean_base, PGHOST="127.0.0.1", PGPORT=str(pgport), PGUSER="genesis_trial",
                      PGDATABASE="postgres", PGPASSWORD=password,
                      ASPNETCORE_ENVIRONMENT="Test", DOTNET_ENVIRONMENT="Test")
        db_env["PATH"] = str(args.pg_bin) + os.pathsep + db_env["PATH"]
        command("initdb", [args.pg_bin / "initdb.exe", "-D", pgdata, "-U", "genesis_trial",
                           "--auth=scram-sha-256", "--pwfile", pwfile, "--encoding=UTF8", "--no-locale"], db_env)
        # pg_ctl may daemonize a server inheriting handles; wait on the control PID,
        # not pipe EOF. The exact new data directory is used again during cleanup.
        pg_started = True
        command("pg-start", [args.pg_bin / "pg_ctl.exe", "-D", pgdata, "-l", private / "postgres.log",
                            "-o", f"-h 127.0.0.1 -p {pgport}", "-w", "start"], db_env, 45)
        command("createdb", [args.pg_bin / "createdb.exe", "genesis_authority_test"], db_env)
        db_env["PGDATABASE"] = "genesis_authority_test"
        credentials_args = ["--credentials", str(fixtures)]
        command("migration-one", [python, root / "scripts/genesis-authority.py", "migrate"], db_env)
        command("fixtures", [python, root / "scripts/genesis-authority.py", *credentials_args, "fixtures"], db_env)
        command("migration-two", [python, root / "scripts/genesis-reimbursements.py", *credentials_args, "migrate"], db_env)
        stage = "authority_start"
        cs = f"Host=127.0.0.1;Port={pgport};Database=genesis_authority_test;Username=genesis_trial;Password={password}"
        backend_url = f"http://127.0.0.1:{backend_port}"
        backend_env = dict(db_env, ConnectionStrings__Default=cs, ASPNETCORE_URLS=backend_url,
                           DOTNET_ROLL_FORWARD="LatestPatch", Logging__LogLevel__Default="Warning")
        backend = start("authority", ["dotnet", root / "backend/HumanAuthority/bin/Release/net10.0/HumanAuthority.dll"], backend_env)
        ready(backend_url + "/health/ready", backend)
        stage = "model_memory_gate"
        recovery_deadline = time.monotonic() + 30
        while True:
            physical, virtual = memory()
            report["freeMiBBeforeModel"] = physical
            if physical >= 2048 and virtual >= 4096:
                break
            if time.monotonic() >= recovery_deadline:
                raise RuntimeError("model_memory_gate_blocked")
            time.sleep(.5)
        stage = "model_start"
        allow = {"SYSTEMROOT", "WINDIR", "PATH", "LOCALAPPDATA", "APPDATA", "USERPROFILE", "HOMEDRIVE",
                 "HOMEPATH", "TEMP", "TMP", "PROCESSOR_ARCHITECTURE", "NUMBER_OF_PROCESSORS", "COMSPEC", "PATHEXT"}
        model_env = {k: v for k, v in clean_base.items() if k.upper() in allow}
        model_env.update(OLLAMA_HOST="127.0.0.1:11434", OLLAMA_MODELS=str(args.models_dir), OLLAMA_NO_CLOUD="1",
                         OLLAMA_NUM_PARALLEL="1", OLLAMA_MAX_LOADED_MODELS="1")
        model = start("ollama", [args.ollama, "serve"], model_env)
        catalogue = ready("http://127.0.0.1:11434/api/tags", model)
        if not owns_listener(model.pid):
            raise RuntimeError("task_model_does_not_own_listener")
        if not any(item.get("name") == args.model for item in catalogue.get("models", [])):
            raise RuntimeError("installed_model_tag_missing")
        logs = "\n".join((private / ("ollama." + part + ".log")).read_text(errors="replace")
                         for part in ("stdout", "stderr"))
        if not re.search(r"cloud disabled[:= ]+true|OLLAMA_NO_CLOUD[:= ]+true", logs, re.I):
            raise RuntimeError("cloud_disabled_log_not_confirmed")
        watcher = threading.Thread(target=watchdog, daemon=True)
        watcher.start()
        stage = "real_inference_governance"
        trial_env = dict(db_env, GENESIS_TEST_DATABASE=cs, GENESIS_AUTHORITY_URL=backend_url,
                         GENESIS_REAL_FRONTEND_PORT=str(front_port), GENESIS_REAL_INFERENCE_TEST="1",
                         GENESIS_MODEL=args.model, GENESIS_TRIAL_REPO=str(root), NEXT_TELEMETRY_DISABLED="1",
                         GENESIS_TRIAL_COORDINATOR=str(Path(__file__).resolve()), GENESIS_TRIAL_PYTHON=sys.executable,
                         GENESIS_TRIAL_OLLAMA_PID=str(model.pid))
        output = command("real-model-connected", [node, args.harness, fixtures, args.playwright_root, private], trial_env, 360)
        report["observations"] = json.loads(output)
        if report["observations"].get("result") != "passed" or report["observations"].get("simulatedInference") is not False:
            raise RuntimeError("actual_model_trial_not_confirmed")
        if pressure.is_set():
            raise RuntimeError("memory_guard_triggered")
        report["passed"] = True
    except Exception:
        report["failureStage"] = stage
        report["memoryGuardTriggered"] = guard_reason[0] == "memory"
        report["guardReason"] = guard_reason[0]
    finally:
        finished.set()
        for process in reversed(owned):
            try:
                stop_process(process)
            except Exception:
                report["cleanupFailed"] = True
        if pg_started:
            try:
                # Avoid the now-stopped guard; cleanup is exact task-owned storage.
                with open(private / "pg-stop.log", "xb") as log:
                    subprocess.run([str(args.pg_bin / "pg_ctl.exe"), "-D", str(pgdata), "-m", "fast", "-w", "stop"],
                                   env=db_env, stdout=log, stderr=log, timeout=45, check=True)
            except Exception:
                report["cleanupFailed"] = True
        for handle in handles:
            handle.close()
        if report.get("cleanupFailed"):
            report["passed"] = False
        report["minimumFreeMiB"] = minimum_free[0]
        report["freeMiBAfterCleanup"] = memory()[0]
        (run_dir / "real-model-result.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(json.dumps(report, indent=2))
    return 0 if report["passed"] and not report.get("cleanupFailed") else 1


if __name__ == "__main__":
    try:
        if sys.argv[1:2] == ["--verify-listener"]:
            if sys.platform != "win32" or len(sys.argv) != 4:
                raise RuntimeError("native_listener_verification_required")
            valid = owns_listener(int(sys.argv[2]), int(sys.argv[3]))
            print(json.dumps({"owned": valid}))
            raise SystemExit(0 if valid else 1)
        if sys.argv[1:] == ["--memory-status"]:
            if sys.platform != "win32":
                raise RuntimeError("native_memory_measurement_required")
            physical, virtual = memory()
            print(json.dumps({"physicalMiB": physical, "virtualMiB": virtual}))
            raise SystemExit(0)
        raise SystemExit(main())
    except Exception:
        print('{"passed":false,"failureStage":"preflight","details":"Inspect private local logs; no secret diagnostics echoed."}')
        raise SystemExit(1)
