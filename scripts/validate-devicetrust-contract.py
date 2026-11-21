#!/usr/bin/env python3
"""Validate real HTTP observations against the checked-in OpenAPI 3.1 contract.

Requires PyYAML and jsonschema. A disposable PostgreSQL connection must already
be supplied as GENESIS_DEVICETRUST_TEST_DATABASE; this runner creates no database.
No observations or connection strings are written to source control.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import tempfile

import yaml
from jsonschema import Draft202012Validator, FormatChecker


def validate_observations(document, observations):
    """Resolve internal refs against the whole contract, and validate payloads."""
    def validate(schema, payload):
        wrapped = {"$schema": "https://json-schema.org/draft/2020-12/schema",
                   "components": document["components"], "allOf": [schema]}
        Draft202012Validator(wrapped, format_checker=FormatChecker()).validate(payload)

    for item in observations:
        operation = document["paths"][item["path"]][item["method"]]
        response = operation["responses"][item["status"]]
        if "$ref" in response:
            response = document["components"]["responses"][response["$ref"].split("/")[-1]]
        if item["body"] is not None:
            validate(response["content"][item["mediaType"]]["schema"], item["body"])
        else:
            # Only authentication/role middleware may omit a response body here.
            assert item["status"] in {"401", "403"}, "Unexpected empty response"
        if item["request"] is not None:
            validate(operation["requestBody"]["content"]["application/json"]["schema"], item["request"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dotnet", default="dotnet")
    parser.add_argument("--configuration", choices=["Debug", "Release"], default="Release")
    parser.add_argument("--no-restore", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    document = yaml.safe_load((root / "docs/irp/03-openapi/device-trust.openapi.yaml").read_text())
    with tempfile.TemporaryDirectory(prefix="genesis-contract-") as directory:
        environment = dict(os.environ, GENESIS_CONTRACT_OBSERVATIONS=directory)
        command = [args.dotnet, "test", "tests/DeviceTrust.OwnershipTests/DeviceTrust.OwnershipTests.csproj",
                   "--configuration", args.configuration,
                   "--filter", "FullyQualifiedName~ContractHttpTests|FullyQualifiedName~HealthPrivacyTests"]
        if args.no_restore:
            command.append("--no-restore")
        subprocess.run(command, cwd=root, env=environment, check=True, timeout=180)
        observations = [json.loads(path.read_text()) for path in Path(directory).glob("*.json")]
        assert len(observations) == 11, f"Expected 11 real HTTP observations, got {len(observations)}"
        validate_observations(document, observations)
        # A discriminating negative check: the old documented hardwareId shape
        # must be rejected as a valid request rather than silently passing.
        schema = document["components"]["schemas"]["TelemetrySubmission"]
        assert not Draft202012Validator(schema).is_valid({"hardwareId": "fixture"})
        print(f"Validated {len(observations)} real HTTP observations against OpenAPI ({args.configuration}).")


if __name__ == "__main__":
    main()
