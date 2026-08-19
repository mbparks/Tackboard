#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
import tempfile
import traceback
from pathlib import Path

from playwright.sync_api import sync_playwright

from _support import app_html, assert_true, launch_kwargs


def run() -> None:
    html = app_html()
    with tempfile.TemporaryDirectory(prefix="tackboard-tests-") as temp_dir:
        temp = Path(temp_dir)
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(**launch_kwargs())
            page = browser.new_page(viewport={"width": 1200, "height": 800}, accept_downloads=True)
            page_errors: list[str] = []
            page.on("pageerror", lambda error: page_errors.append(str(error)))
            try:
                page.set_content(html, wait_until="load")
                page.wait_for_timeout(300)
                page.evaluate("window.TACKBOARD_DEBUG.loadExampleBoard()")
                page.wait_for_timeout(300)

                # Set the new Kanban On Hold field before export.
                kanban_id = page.evaluate('window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.objectType==="template-note").id')
                page.evaluate("id => window.TACKBOARD_DEBUG.selectIds([id])", kanban_id)
                page.keyboard.press("Enter")
                page.locator(f'[data-object-id="{kanban_id}"] [data-kanban-field="onHold"]').check()
                page.locator(f'[data-object-id="{kanban_id}"] [data-finish-edit]').click()
                page.wait_for_timeout(120)

                # Current-board JSON download.
                page.locator("#exportButton").click()
                with page.expect_download() as download_info:
                    page.locator('[data-pop-action="export-board-json"]').click()
                download = download_info.value
                json_path = temp / download.suggested_filename
                download.save_as(json_path)
                payload = json.loads(json_path.read_text(encoding="utf-8"))
                assert_true(payload["format"] == "tackboard-board", "JSON export format marker is incorrect")
                assert_true(payload["schemaVersion"] == 2, "JSON export schema version is incorrect")
                assert_true(payload["appVersion"] == "1.3.0", "JSON export app version is incorrect")
                assert_true(len(payload["board"]["objects"]) >= 7, "JSON export lost board objects")
                exported_kanban = next(obj for obj in payload["board"]["objects"] if obj["objectType"] == "template-note")
                assert_true(exported_kanban["templateVersion"] == 2, "Kanban template version was not upgraded")
                assert_true(exported_kanban["fields"]["onHold"] is True, "JSON export lost the On Hold value")

                # PNG rendering with preview.
                page.locator("#exportButton").click()
                page.locator('[data-pop-action="export-png-board-v12"]').click()
                page.wait_for_timeout(100)
                with page.expect_download() as download_info:
                    page.locator("dialog[open] .button.primary").click()
                download = download_info.value
                png_path = temp / download.suggested_filename
                download.save_as(png_path)
                assert_true(png_path.read_bytes()[:8] == b"\x89PNG\r\n\x1a\n", "PNG export is not a valid PNG file")
                assert_true(png_path.stat().st_size > 10_000, "PNG export is unexpectedly small")

                # PDF/print output opens a populated print view.
                page.locator("#exportButton").click()
                with page.expect_popup() as popup_info:
                    page.locator('[data-pop-action="export-pdf-view-v12"]').click()
                    page.wait_for_timeout(100)
                    page.locator("dialog[open] .button.primary").click()
                popup = popup_info.value
                popup.wait_for_load_state("domcontentloaded")
                popup.wait_for_timeout(500)
                assert_true(popup.locator(".print-page").count() >= 1, "PDF print view contains no pages")
                popup.close()

                # Import a schema-v2 board as a new board.
                import_payload = {
                    "format": "tackboard-board",
                    "schemaVersion": 2,
                    "appVersion": "1.3.0",
                    "board": {
                        "name": "Imported Board",
                        "description": "Automated import test",
                        "background": "dots",
                        "viewport": {"x": 100, "y": 90, "zoom": 1},
                        "objects": [{
                            "id": "note-import",
                            "objectType": "blank-note",
                            "x": 500,
                            "y": 500,
                            "width": 270,
                            "height": 220,
                            "title": "Imported",
                            "content": "Hello",
                            "tag": "",
                            "checklist": False,
                            "checkedItems": {},
                            "color": "yellow",
                            "zIndex": 1,
                            "rotation": 0,
                        }, {
                            "id": "kanban-import",
                            "objectType": "template-note",
                            "templateId": "kanban",
                            "templateVersion": 1,
                            "displayMode": "expanded",
                            "x": 850,
                            "y": 420,
                            "width": 360,
                            "height": 650,
                            "color": "blue",
                            "zIndex": 2,
                            "rotation": 0,
                            "fields": {
                                "ticketNumber": "OLD-1",
                                "ticketType": "Story",
                                "sprintNumber": "",
                                "epic": "Migration",
                                "description": "Older Kanban data without On Hold",
                                "team": "SPA",
                                "reporter": "",
                                "assignee": "",
                                "status": "Backlog",
                                "needsVP": False,
                                "needByDate": "",
                            },
                        }],
                        "connectors": [],
                    },
                }
                import_path = temp / "import-board.json"
                import_path.write_text(json.dumps(import_payload), encoding="utf-8")
                page.set_input_files("#importInput", import_path)
                page.wait_for_timeout(100)
                page.locator('dialog[open] [data-dialog-value="3"]').click()
                page.wait_for_timeout(200)
                state = page.evaluate("window.TACKBOARD_DEBUG.getState()")
                assert_true(len(state["boards"]) == 3, "Imported board was not added")
                assert_true(state["boards"][-1]["name"] == "Imported Board", "Imported board name changed unexpectedly")
                assert_true(page.locator('[data-object-id="note-import"]').count() == 1, "Imported note was not rendered")
                imported_kanban = next(obj for obj in state["boards"][-1]["objects"] if obj["id"] == "kanban-import")
                assert_true(imported_kanban["templateVersion"] == 2, "Older Kanban template was not migrated")
                assert_true(imported_kanban["fields"]["onHold"] is False, "Missing On Hold field did not migrate to unchecked")

                # Malformed JSON produces a visible error instead of crashing.
                bad_path = temp / "bad.json"
                bad_path.write_text("{bad", encoding="utf-8")
                page.set_input_files("#importInput", bad_path)
                page.wait_for_timeout(150)
                assert_true(page.locator(".toast.error").count() >= 1, "Malformed import did not show an error")

                if page_errors:
                    raise AssertionError(f"I/O page errors: {page_errors}")
                print("Import and export tests passed.")
            finally:
                page.close()
                browser.close()


if __name__ == "__main__":
    try:
        run()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
