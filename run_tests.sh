#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 build.py --check
python3 tests/test_empty_state.py
python3 tests/test_kanban_on_hold.py
python3 tests/test_interactions.py
python3 tests/test_io.py
