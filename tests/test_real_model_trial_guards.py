"""Fault regressions for the coordinator; no Windows services or inference required."""
import importlib.util
import json
from pathlib import Path
import tempfile
import threading
import unittest

SOURCE = Path(__file__).resolve().parents[1] / "scripts/validate-real-local-inference-windows.py"
spec = importlib.util.spec_from_file_location("real_trial", SOURCE)
trial = importlib.util.module_from_spec(spec)
spec.loader.exec_module(trial)


class DatabaseEnvironmentTests(unittest.TestCase):
    def test_inherited_connection_overrides_are_not_forwarded(self):
        hostile = {"PGHOSTADDR": "198.51.100.1", "PGSERVICE": "production",
                   "PGSERVICEFILE": "/private/service", "PGPASSFILE": "/private/passwords",
                   "PGOPTIONS": "-c search_path=foreign", "PGSSLMODE": "require",
                   "pghost": "production", "PgPassword": "old", "PGDATABASE": "customer",
                   "PATH": "/tools", "SYSTEMROOT": "Windows"}
        env = trial.trial_database_environment(hostile, 55432, "synthetic-new-secret")
        self.assertEqual({k: v for k, v in env.items() if k.upper().startswith("PG")},
                         {"PGHOST": "127.0.0.1", "PGPORT": "55432", "PGUSER": "genesis_trial",
                          "PGDATABASE": "postgres", "PGPASSWORD": "synthetic-new-secret"})
        self.assertEqual(env["PATH"], "/tools")
        self.assertEqual(env["ASPNETCORE_ENVIRONMENT"], "Test")
        self.assertEqual(hostile["PGDATABASE"], "customer", "Do not mutate the parent environment")


class ClusterOwnershipTests(unittest.TestCase):
    def test_existing_cluster_is_never_adopted_or_modified(self):
        with tempfile.TemporaryDirectory() as directory:
            private = Path(directory)
            legacy = private / "postgres"
            legacy.mkdir()
            sentinel = legacy / "postmaster.pid"
            sentinel.write_text("not-owned", encoding="utf-8")
            token = "a" * 32
            cluster = trial.claim_cluster(private, token)
            with self.assertRaises(FileExistsError):
                trial.claim_cluster(private, token)
            self.assertEqual(sentinel.read_text(), "not-owned")
            self.assertEqual(cluster.name, "postgres-" + token)
            self.assertFalse((private / (cluster.name + ".start-requested.json")).exists())

    def test_start_claim_binds_invocation_path_and_coordinator_and_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            private = Path(directory)
            token = "b" * 32
            cluster = trial.claim_cluster(private, token)
            trial.record_cluster_start(private, token, cluster, 12345)
            marker = private / (cluster.name + ".start-requested.json")
            self.assertEqual(json.loads(marker.read_text()), {"invocationId": token,
                             "clusterPath": str(cluster.resolve()), "coordinatorPid": 12345})
            with self.assertRaises(FileExistsError):
                trial.record_cluster_start(private, token, cluster, 67890)
            self.assertEqual(json.loads(marker.read_text())["coordinatorPid"], 12345)

    def test_invalid_and_path_like_tokens_are_rejected(self):
        for token in ["../postgres", "A" * 32, "0" * 32, "a" * 31, "a/" * 16, 1]:
            with self.subTest(token=token), self.assertRaises(ValueError):
                trial.invocation_token(token)

    def test_direct_invocations_get_distinct_claims(self):
        self.assertNotEqual(trial.invocation_token(), trial.invocation_token())


class WatchdogVerdictTests(unittest.TestCase):
    def test_inflight_unsafe_sample_is_not_missed(self):
        finished, pressure, sampled = threading.Event(), threading.Event(), threading.Event()
        def sample_already_in_progress():
            sampled.set()
            if finished.wait(2):
                pressure.set()
        watcher = threading.Thread(target=sample_already_in_progress)
        watcher.start()
        self.assertTrue(sampled.wait(1))
        self.assertFalse(pressure.is_set(), "Reproduce the original pre-join false-pass window")
        self.assertFalse(trial.settle_watchdog(finished, watcher, pressure, timeout=2))
        self.assertTrue(pressure.is_set())
        self.assertFalse(watcher.is_alive())

    def test_clean_watchdog_can_confirm_success(self):
        finished, pressure = threading.Event(), threading.Event()
        watcher = threading.Thread(target=lambda: finished.wait(2))
        watcher.start()
        self.assertTrue(trial.settle_watchdog(finished, watcher, pressure, timeout=2))
        self.assertFalse(watcher.is_alive())

    def test_unsettled_or_unstarted_watchdog_never_authorizes_success(self):
        class Unsettled:
            def join(self, timeout):
                self.timeout = timeout
            def is_alive(self):
                return True
        watcher = Unsettled()
        self.assertFalse(trial.settle_watchdog(threading.Event(), watcher, threading.Event(), timeout=.1))
        self.assertEqual(watcher.timeout, .1)
        self.assertFalse(trial.settle_watchdog(threading.Event(), threading.Thread(), threading.Event()))


class ReportPreservationTests(unittest.TestCase):
    def test_diagnostic_failure_does_not_erase_stage_or_cleanup_result(self):
        def unavailable():
            raise OSError("Synthetic measurement failure; not an actual Windows probe")
        with tempfile.TemporaryDirectory() as directory:
            report = {"passed": False, "failureStage": "real_inference_governance", "cleanupFailed": True}
            trial.write_report(Path(directory), report, sample=unavailable)
            saved = json.loads((Path(directory) / "real-model-result.json").read_text())
            self.assertEqual(saved["failureStage"], "real_inference_governance")
            self.assertTrue(saved["cleanupFailed"])
            self.assertTrue(saved["finalMemoryMeasurementUnavailable"])
            self.assertIsNone(saved["freeMiBAfterCleanup"])
            self.assertFalse(saved["passed"])

    def test_successful_diagnostic_keeps_its_actual_value(self):
        with tempfile.TemporaryDirectory() as directory:
            report = {"passed": True}
            trial.write_report(Path(directory), report, sample=lambda: (2049, 4097))
            saved = json.loads((Path(directory) / "real-model-result.json").read_text())
            self.assertEqual(saved["freeMiBAfterCleanup"], 2049)
            self.assertNotIn("finalMemoryMeasurementUnavailable", saved)


if __name__ == "__main__":
    unittest.main()
