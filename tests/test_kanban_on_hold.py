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
    with tempfile.TemporaryDirectory(prefix="tackboard-on-hold-") as temp_dir:
        temp = Path(temp_dir)
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(**launch_kwargs())
            page = browser.new_page(viewport={"width": 1280, "height": 860}, accept_downloads=True)
            page_errors: list[str] = []
            console_errors: list[str] = []
            page.on("pageerror", lambda error: page_errors.append(str(error)))
            page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
            try:
                page.set_content(html, wait_until="load")
                page.wait_for_timeout(300)
                assert_true(page.evaluate("window.TACKBOARD_DEBUG.version") == "1.2.2", "version mismatch")

                note_id = page.evaluate("window.TACKBOARD_DEBUG.addKanbanNote({x:760,y:480}).id")
                page.wait_for_timeout(120)
                note = page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(obj => obj.id === id)", note_id)
                assert_true(note["templateVersion"] == 2, "New Kanban note did not use template version 2")
                assert_true(note["fields"]["onHold"] is False, "On Hold did not default to unchecked")

                page.evaluate("id => window.TACKBOARD_DEBUG.selectIds([id])", note_id)
                page.keyboard.press("Enter")
                page.wait_for_timeout(100)
                checkbox = page.locator(f'[data-object-id="{note_id}"] [data-kanban-field="onHold"]')
                assert_true(checkbox.count() == 1, "On Hold checkbox is missing from Edit Mode")
                assert_true(not checkbox.is_checked(), "On Hold checkbox was unexpectedly checked")
                label = page.locator(f'label[for="{note_id}-onHold"]')
                assert_true(label.count() == 1 and "on hold" in label.inner_text().lower(), "On Hold checkbox label is missing")
                label.click()
                page.wait_for_timeout(80)
                assert_true(checkbox.is_checked(), "Clicking the On Hold label did not toggle the checkbox")
                page.locator(f'[data-object-id="{note_id}"] [data-finish-edit]').click()
                page.wait_for_timeout(120)

                note = page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(obj => obj.id === id)", note_id)
                assert_true(note["fields"]["onHold"] is True, "On Hold value was not stored")
                assert_true(page.locator(f'[data-object-id="{note_id}"] .badge.on-hold', has_text="On Hold").count() == 1, "On Hold header badge is missing")
                on_hold_field = page.locator(f'[data-object-id="{note_id}"] .kanban-field', has_text="On Hold").first
                assert_true(on_hold_field.count() == 1 and "Yes" in on_hold_field.inner_text(), "On Hold is not readable in View Mode")

                # Compact View retains the On Hold indicator.
                page.locator(f'[data-object-id="{note_id}"] [data-toggle-compact]').click()
                page.wait_for_timeout(100)
                compact_field = page.locator(f'[data-object-id="{note_id}"] .kanban-field', has_text="On Hold").first
                assert_true(compact_field.count() == 1 and "Yes" in compact_field.inner_text(), "Compact View omitted On Hold")

                # Search and filters understand the new boolean field.
                page.locator("#searchButton").click()
                page.locator("#searchInput").fill("On Hold")
                page.wait_for_timeout(120)
                assert_true("1 result" in page.locator("#searchCount").inner_text(), "Search did not find an On Hold note")
                page.locator("#searchClose").click()

                page.locator("#filterButton").click()
                assert_true(page.locator("#filterOnHold").count() == 1, "On Hold filter is missing")
                page.select_option("#filterOnHold", "yes")
                page.locator('#filterForm button[type="submit"]').click()
                page.wait_for_timeout(120)
                chip = page.locator('[data-clear-filter="onHold"]')
                assert_true(chip.count() == 1 and "On Hold: Yes" in chip.inner_text(), "On Hold filter chip is missing or incorrect")
                chip.click()
                page.wait_for_timeout(80)

                # JSON export preserves the field and template version.
                page.locator("#exportButton").click()
                with page.expect_download() as download_info:
                    page.locator('[data-pop-action="export-board-json"]').click()
                download = download_info.value
                output = temp / download.suggested_filename
                download.save_as(output)
                payload = json.loads(output.read_text(encoding="utf-8"))
                exported = next(obj for obj in payload["board"]["objects"] if obj["id"] == note_id)
                assert_true(exported["fields"]["onHold"] is True, "JSON export lost On Hold")
                assert_true(exported["templateVersion"] == 2, "JSON export lost the Kanban template version")

                # Clear Field Values returns On Hold to its unchecked default.
                page.evaluate("id => window.TACKBOARD_DEBUG.selectIds([id])", note_id)
                page.locator('#contextToolbar [data-action="more"]').click()
                page.locator('[data-pop-action="clear-kanban"]').click()
                page.wait_for_timeout(80)
                page.locator('dialog[open] [data-dialog-value="1"]').click()
                page.wait_for_timeout(120)
                cleared = page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(obj => obj.id === id)", note_id)
                assert_true(cleared["fields"]["onHold"] is False, "Clear Field Values did not reset On Hold")

                if page_errors:
                    raise AssertionError(f"On Hold page errors: {page_errors}")
                if console_errors:
                    raise AssertionError(f"On Hold console errors: {console_errors}")
                print("Kanban On Hold tests passed.")
            finally:
                page.close()
                browser.close()


if __name__ == "__main__":
    try:
        run()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
