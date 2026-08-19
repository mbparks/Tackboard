#!/usr/bin/env python3
"""Rebuild TACKBOARD's self-contained index.html from the modular source fragments."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
TEMPLATE = SRC / "index.template.html"
CSS_DIR = SRC / "css"
JS_DIR = SRC / "js"
DEFAULT_OUTPUT = ROOT / "index.html"
STYLE_MARKER = "/*__TACKBOARD_STYLES__*/"
SCRIPT_MARKER = "/*__TACKBOARD_APP__*/"


def concatenate(directory: Path, pattern: str) -> str:
    files = sorted(directory.glob(pattern))
    if not files:
        raise FileNotFoundError(f"No source fragments matched {directory / pattern}")
    return "".join(path.read_text(encoding="utf-8") for path in files)


def build_text() -> str:
    template = TEMPLATE.read_text(encoding="utf-8")
    if template.count(STYLE_MARKER) != 1 or template.count(SCRIPT_MARKER) != 1:
        raise ValueError("The HTML template must contain each build marker exactly once.")
    styles = concatenate(CSS_DIR, "*.css")
    app = concatenate(JS_DIR, "*.js")
    return template.replace(STYLE_MARKER, styles).replace(SCRIPT_MARKER, app)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Output HTML path")
    parser.add_argument("--check", action="store_true", help="Verify that the output is already current")
    args = parser.parse_args()

    try:
        rendered = build_text()
    except (OSError, ValueError) as error:
        print(f"Build failed: {error}", file=sys.stderr)
        return 2

    output = args.output.resolve()
    if args.check:
        try:
            current = output.read_text(encoding="utf-8")
        except OSError as error:
            print(f"Build check failed: {error}", file=sys.stderr)
            return 2
        if current != rendered:
            print(f"Build check failed: {output} does not match the source fragments.", file=sys.stderr)
            return 1
        print(f"Build check passed: {output}")
        return 0

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(rendered, encoding="utf-8")
    print(f"Built {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
