#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
import traceback

from playwright.sync_api import sync_playwright

from _support import app_html, assert_true, launch_kwargs


def open_app(browser):
    page = browser.new_page(viewport={"width": 1100, "height": 760})
    page_errors: list[str] = []
    console_errors: list[str] = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.set_content(app_html(), wait_until="load")
    page.wait_for_timeout(300)
    assert_true(page.locator("#emptyState:not(.hidden)").count() == 1, "Initial empty state is not visible")
    return page, page_errors, console_errors


def assert_clean(page_errors: list[str], console_errors: list[str], label: str) -> None:
    assert_true(not page_errors, f"{label} produced page errors: {page_errors}")
    assert_true(not console_errors, f"{label} produced console errors: {console_errors}")


def run() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(**launch_kwargs())
        try:
            # Blank Note must work in Select mode.
            page, page_errors, console_errors = open_app(browser)
            assert_true(page.evaluate("window.TACKBOARD_DEBUG.version") == "1.2.2", "version mismatch")
            page.locator('[data-empty-action="blank"]').click()
            page.wait_for_timeout(160)
            assert_true(page.locator('[data-object-type="blank-note"]').count() == 1, "Blank Note startup button did not create a note")
            assert_true(page.locator('[data-object-type="blank-note"].editing').count() == 1, "Blank Note startup button did not enter edit mode")
            assert_clean(page_errors, console_errors, "Blank Note startup action")
            page.close()

            # Kanban Note must remain usable even while Pan is the active canvas tool.
            page, page_errors, console_errors = open_app(browser)
            page.locator('[data-tool="pan"]').click()
            page.locator('[data-empty-action="kanban"]').click()
            page.wait_for_timeout(160)
            assert_true(page.locator('[data-object-type="template-note"]').count() == 1, "Kanban startup button did not create a structured note in Pan mode")
            assert_clean(page_errors, console_errors, "Kanban startup action")
            page.close()

            # Sticker opens the complete picker without starting a marquee gesture.
            page, page_errors, console_errors = open_app(browser)
            page.locator('[data-empty-action="sticker"]').click()
            page.wait_for_timeout(120)
            assert_true(page.locator('#popover:not(.hidden) [data-sticker-choice]').count() >= 17, "Sticker startup button did not open the sticker picker")
            assert_clean(page_errors, console_errors, "Sticker startup action")
            page.close()

            # Add Frame creates a frame and dismisses the empty state.
            page, page_errors, console_errors = open_app(browser)
            page.locator('[data-empty-action="frame"]').click()
            page.wait_for_timeout(160)
            assert_true(page.locator('[data-object-type="frame"]').count() == 1, "Add Frame startup button did not create a frame")
            assert_true(page.locator('#emptyState.hidden').count() == 1, "Empty state did not dismiss after frame creation")
            assert_clean(page_errors, console_errors, "Add Frame startup action")
            page.close()

            # Load Example creates and opens a separate populated board.
            page, page_errors, console_errors = open_app(browser)
            before_count = page.evaluate("window.TACKBOARD_DEBUG.getState().boards.length")
            page.locator('[data-empty-action="example"]').click()
            page.wait_for_timeout(260)
            state = page.evaluate("window.TACKBOARD_DEBUG.getState()")
            current = page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard()")
            assert_true(len(state["boards"]) == before_count + 1, "Load Example startup button did not create a board")
            assert_true(current["name"] == "TACKBOARD Example" and len(current["objects"]) >= 7, "Load Example startup button did not open populated example content")
            assert_clean(page_errors, console_errors, "Load Example startup action")
            page.close()

            # Import Board must invoke the native file chooser and complete a valid import.
            page, page_errors, console_errors = open_app(browser)
            payload = {
                "format": "tackboard-board",
                "schemaVersion": 2,
                "appVersion": "1.2.2",
                "board": {
                    "name": "Startup Import",
                    "description": "Empty-state import regression",
                    "background": "dots",
                    "viewport": {"x": 100, "y": 90, "zoom": 1},
                    "objects": [{
                        "id": "startup-import-note",
                        "objectType": "blank-note",
                        "x": 500,
                        "y": 500,
                        "width": 270,
                        "height": 220,
                        "title": "Imported from startup",
                        "content": "Working",
                        "tag": "",
                        "checklist": False,
                        "checkedItems": {},
                        "color": "yellow",
                        "zIndex": 1,
                        "rotation": 0,
                    }],
                    "connectors": [],
                },
            }
            with page.expect_file_chooser() as chooser_info:
                page.locator('[data-empty-action="import"]').click()
            chooser_info.value.set_files({
                "name": "startup-import.tackboard.json",
                "mimeType": "application/json",
                "buffer": json.dumps(payload).encode("utf-8"),
            })
            page.wait_for_timeout(180)
            assert_true(page.locator('dialog[open]').count() == 1, "Import Board startup button did not open the import workflow")
            page.locator('dialog[open] [data-dialog-value="3"]').click()
            page.wait_for_timeout(220)
            current = page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard()")
            assert_true(current["name"] == "Startup Import", "Startup import did not create the selected board")
            assert_true(page.locator('[data-object-id="startup-import-note"]').count() == 1, "Startup import did not render the imported note")
            assert_clean(page_errors, console_errors, "Import Board startup action")
            page.close()

            print("Initial empty-state action tests passed.")
        finally:
            browser.close()


if __name__ == "__main__":
    try:
        run()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
