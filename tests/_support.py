from __future__ import annotations

import os
import shutil
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"

_FAKE_STORAGE = """<script>(()=>{const m=window.__TBSTORE||(window.__TBSTORE=new Map());Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>Array.from(m.keys())[i]||null,get length(){return m.size}}});})();</script>"""


def app_html() -> str:
    source = INDEX.read_text(encoding="utf-8")
    marker = "<script>\n(() => {"
    if marker not in source:
        raise RuntimeError("Could not locate TACKBOARD application script.")
    return source.replace(marker, f"{_FAKE_STORAGE}\n{marker}", 1)


def launch_kwargs() -> dict[str, Any]:
    configured = os.environ.get("TACKBOARD_CHROMIUM")
    candidates = [configured, shutil.which("chromium"), shutil.which("chromium-browser"), shutil.which("google-chrome"), shutil.which("google-chrome-stable")]
    executable = next((candidate for candidate in candidates if candidate), None)
    kwargs: dict[str, Any] = {"headless": True, "args": ["--no-sandbox", "--disable-web-security"]}
    if executable:
        kwargs["executable_path"] = executable
    return kwargs


def assert_true(value: Any, message: str) -> None:
    if not value:
        raise AssertionError(message)


def approx(a: float, b: float, tolerance: float = 0.5) -> bool:
    return abs(a - b) <= tolerance
