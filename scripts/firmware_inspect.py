#!/usr/bin/env python3
"""Offline, read-only firmware asset inspector for Acing IU: Genesis.

Reports observed size and SHA-256 only. No authenticity certification,
device communication, network access, or privileged firmware operation.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import stat
import sys
from typing import Any, Sequence

CHUNK_BYTES = 1024 * 1024
SCHEMA_VERSION = "1.0"


class InspectionError(Exception):
    """A file cannot be inspected with reliable read-only semantics."""


def inspect_file(path_text: str) -> dict[str, Any]:
    """Hash a regular local file, rejecting symbolic links and detected changes."""
    path = Path(path_text)
    try:
        if path.is_symlink():
            raise InspectionError("symbolic links are not accepted")
        flags = os.O_RDONLY | getattr(os, "O_BINARY", 0)
        if hasattr(os, "O_NOFOLLOW"):
            flags |= os.O_NOFOLLOW
        fd = os.open(path, flags)
    except InspectionError:
        raise
    except OSError as exc:
        raise InspectionError(f"cannot open file: {exc.strerror or type(exc).__name__}") from exc

    try:
        before = os.fstat(fd)
        if not stat.S_ISREG(before.st_mode):
            raise InspectionError("path does not refer to a regular file")
        digest = hashlib.sha256()
        bytes_read = 0
        with os.fdopen(fd, "rb", closefd=False) as source:
            while True:
                block = source.read(CHUNK_BYTES)
                if not block:
                    break
                digest.update(block)
                bytes_read += len(block)
        after = os.fstat(fd)
        if (before.st_size != after.st_size or
            before.st_mtime_ns != after.st_mtime_ns or
            before.st_ctime_ns != after.st_ctime_ns or
            bytes_read != before.st_size):
            raise InspectionError("file changed during inspection; discard digest")
        return {
            "path": str(path.absolute()),
            "size_bytes": bytes_read,
            "sha256": digest.hexdigest(),
            "status": "OBSERVED_ONLY",
            "authenticity": "NOT_VERIFIED",
            "device_compatibility": "NOT_ASSESSED",
        }
    except OSError as exc:
        raise InspectionError(f"read failed: {exc.strerror or type(exc).__name__}") from exc
    finally:
        os.close(fd)


def run(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", help="Existing local regular files to inspect")
    args = parser.parse_args(argv)
    results: list[dict[str, Any]] = []
    failed = False
    for candidate in args.paths:
        try:
            results.append(inspect_file(candidate))
        except InspectionError as exc:
            failed = True
            results.append({
                "path": str(Path(candidate).absolute()),
                "status": "ERROR",
                "error": str(exc),
            })
    report = {
        "schema_version": SCHEMA_VERSION,
        "tool": "genesis-offline-firmware-asset-inspector",
        "scope": "READ_ONLY_FILE_METADATA",
        "warning": (
            "A SHA-256 digest is not proof of origin, firmware authenticity, "
            "device compatibility, or certification."
        ),
        "results": results,
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 1 if failed else 0


if __name__ == "__main__":
    try:
        sys.exit(run())
    except (BrokenPipeError, KeyboardInterrupt):
        sys.exit(130)
