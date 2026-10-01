#!/system/bin/sh
# Acing Guardian boot integration placeholder.
#
# Current status: NOT OPERATIONAL.
# This repository does not contain a verified device/ROM executor for AVB
# enforcement, hardware-vault initialization, policy loading, runtime monitoring,
# or system remount operations. Keeping those commands in an executable boot
# script would turn design targets into unverified behavior.
#
# A future device-specific integration must be introduced behind explicit
# supported-target, recovery, authorization, and validation gates before this
# script may perform system changes.

echo "[Acing Guardian] Boot integration unavailable: target capability only." >&2
exit 2
