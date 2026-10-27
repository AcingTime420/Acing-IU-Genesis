#!/usr/bin/env python3
"""Validate built API OpenAPI documents without a database or Redis connection.

Run after a Release build with dotnet on PATH. Each server binds loopback, uses
ephemeral fixture keys, and is terminated by this test. No data-changing request
is issued. This is not a persistence or authenticated-authorization test.
"""
import base64
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request


ROOT = Path(__file__).resolve().parents[2]


def smoke(service, protected_path):
    artifact = ROOT / f"backend/{service}/src/AcingIU.{service}.Api/bin/Release/net8.0/AcingIU.{service}.Api.dll"
    if not artifact.is_file():
        raise RuntimeError(f"Release build required: {artifact}")
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    environment = os.environ.copy()
    environment.update({
        "ASPNETCORE_ENVIRONMENT": "Development",
        "ASPNETCORE_URLS": f"http://127.0.0.1:{port}",
        "Jwt__SigningKey": secrets.token_hex(32),
        "Jwt__Issuer": "openapi-smoke-fixture",
        "Jwt__Audience": "openapi-smoke-fixture",
        "Redis__Connection": "127.0.0.1:1,abortConnect=false",
        "ConnectionStrings__Default": "Host=127.0.0.1;Port=1;Database=genesis_openapi_smoke_test;Username=fixture",
        "Mfa__SecretProtection__ActiveKeyId": "smoke-fixture",
        "Mfa__SecretProtection__Keys__smoke-fixture": base64.b64encode(secrets.token_bytes(32)).decode(),
    })
    base = f"http://127.0.0.1:{port}"
    with tempfile.TemporaryFile(mode="w+") as output:
        process = subprocess.Popen(["dotnet", str(artifact)], cwd=artifact.parent,
                                   env=environment, stdout=output, stderr=subprocess.STDOUT)
        try:
            deadline = time.monotonic() + 20
            while True:
                if process.poll() is not None:
                    raise RuntimeError(f"{service} exited before its OpenAPI document was available")
                try:
                    with urllib.request.urlopen(base + "/swagger/v1/swagger.json", timeout=2) as response:
                        document = json.load(response)
                    break
                except (OSError, urllib.error.URLError):
                    if time.monotonic() >= deadline:
                        raise RuntimeError(f"{service} OpenAPI readiness timeout")
                    time.sleep(0.1)
            bearer = document["components"]["securitySchemes"]["Bearer"]
            assert bearer["type"] == "http", bearer
            assert bearer["scheme"].lower() == "bearer", bearer
            assert {"Bearer": []} in document["security"], document["security"]
            try:
                urllib.request.urlopen(base + protected_path, timeout=5).close()
            except urllib.error.HTTPError as error:
                assert error.code == 401, error.code
            else:
                raise AssertionError(f"{service}: protected endpoint accepted an unauthenticated request")
            print(f"PASS: {service} serves a Bearer-secured OpenAPI document and rejects missing authentication")
        finally:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)


if __name__ == "__main__":
    smoke("Identity", "/api/auth/me")
    smoke("DeviceTrust", "/api/trust/devices/fixture-device")
