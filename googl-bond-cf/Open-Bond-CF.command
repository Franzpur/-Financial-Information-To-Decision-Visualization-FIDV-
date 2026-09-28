#!/bin/bash
cd "$(dirname "$0")"
python3 scripts/build_cashflows.py || exit 1
echo "Opening http://127.0.0.1:8791/ …"
python3 server/app.py
