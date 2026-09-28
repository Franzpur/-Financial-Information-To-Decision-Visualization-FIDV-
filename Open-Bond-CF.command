#!/usr/bin/env bash
# Forward to googl-bond-cf launcher (same pattern as Open-AI-Cube.command).
exec "$(cd "$(dirname "$0")" && pwd)/googl-bond-cf/Open-Bond-CF.command"
