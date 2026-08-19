#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
import tempfile
import traceback
from pathlib import Path

from playwright.sync_api import sync_playwright

from _support import app_html, approx, assert_true, launch_kwargs


def clean_errors(page_errors: list[str], console_errors: list[str], label: str) -> None:
    assert_true(not page_errors, f"{label} produced page errors: {page_errors}")
    assert_true(not console_errors, f"{label} produced console errors: {console_errors}")


def run_desktop(browser) -> None:
    page = browser.new_page(viewport={"width": 1440, "height": 900}, accept_downloads=True)
    page_errors: list[str] = []
    console_errors: list[str] = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.set_content(app_html(), wait_until="load")
    page.wait_for_timeout(260)

    assert_true(page.evaluate("window.TACKBOARD_DEBUG.version") == "1.3.0", "version mismatch")
    note_id = page.evaluate("window.TACKBOARD_DEBUG.addKanbanNote({x:760,y:470}).id")
    page.wait_for_timeout(150)
    note = page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id)", note_id)
    assert_true(note["width"] == 380 and note["height"] == 474, "new expanded Kanban card is not using canonical dimensions")
    assert_true(note.get("kanbanLayoutVersion") == 1, "new Kanban card is missing layout version 1")

    card = page.locator(f'#objectLayer [data-object-id="{note_id}"]')
    before_edit = card.bounding_box()
    page.evaluate("id => window.TACKBOARD_DEBUG.selectIds([id])", note_id)
    page.keyboard.press("Enter")
    page.wait_for_timeout(180)
    assert_true(page.locator("#kanbanEditorSheet").is_visible(), "Kanban editor sheet did not open")
    assert_true(page.locator("#kanbanEditorSheet").get_attribute("data-object-id") == note_id, "editor sheet is not linked to the selected card")
    assert_true(page.locator("#kanbanEditorSheet").get_attribute("aria-modal") == "false", "desktop editor should be a nonmodal attached sheet")
    during_edit = card.bounding_box()
    assert_true(approx(before_edit["width"], during_edit["width"], 1.0) and approx(before_edit["height"], during_edit["height"], 1.0), "opening Edit Mode changed the board card dimensions")
    assert_true(page.locator(f'#objectLayer [data-object-id="{note_id}"] [data-kanban-field]').count() == 0, "Kanban form controls are still embedded inside the board card")
    assert_true(page.locator('#kanbanEditorSheet [data-kanban-editor-field]').count() == 12, "editor sheet does not expose every Kanban field")
    section_order = page.locator('#kanbanEditorSheet [data-kanban-editor-section]').evaluate_all("nodes => nodes.map(node => node.dataset.kanbanEditorSection)")
    assert_true(section_order == ["identity", "work", "ownership", "state"], "Kanban editor sections are out of order")
    editor_box = page.locator("#kanbanEditorSheet").bounding_box()
    assert_true(editor_box["x"] >= 0 and editor_box["y"] >= 54 and editor_box["x"] + editor_box["width"] <= 1440 and editor_box["y"] + editor_box["height"] <= 900, "desktop editor is not contained within the viewport")

    long_description = (
        "Make expanded and editing views consistent without manual resizing. "
        "Preserve the board arrangement and connector geometry while keeping every field visible. "
        "This deliberately long description verifies the clamped summary and full Read more viewer. "
        "The complete final sentence must remain available in the full description reader."
    )
    values = {
        "ticketNumber": "ABC-123",
        "sprintNumber": "Sprint 24",
        "epic": "Canvas Improvements",
        "description": long_description,
        "reporter": "Jordan Smith",
        "assignee": "Casey Lee",
        "needByDate": "2026-08-30",
    }
    for key, value in values.items():
        page.locator(f'#kanbanEditorSheet [data-kanban-editor-field="{key}"]').fill(value)
    page.locator('#kanbanEditorSheet [data-kanban-editor-field="ticketType"]').select_option("Bug")
    page.locator('#kanbanEditorSheet [data-kanban-editor-field="team"]').select_option("SPA")
    page.locator('#kanbanEditorSheet [data-kanban-editor-field="status"]').select_option("In Dev")
    page.locator('#kanbanEditorSheet [data-kanban-editor-field="onHold"]').check()
    page.locator('#kanbanEditorSheet [data-kanban-editor-field="needsVP"]').check()
    page.wait_for_timeout(180)
    typed_box = card.bounding_box()
    assert_true(approx(before_edit["width"], typed_box["width"], 1.0) and approx(before_edit["height"], typed_box["height"], 1.0), "editing field content changed the card dimensions")
    page.locator("#kanbanEditorDone").click()
    page.wait_for_timeout(220)
    assert_true(not page.locator("#kanbanEditorSheet").is_visible(), "Done did not close the editor sheet")

    after_edit = card.bounding_box()
    assert_true(approx(before_edit["width"], after_edit["width"], 1.0) and approx(before_edit["height"], after_edit["height"], 1.0), "leaving Edit Mode changed the card dimensions")
    body_metrics = page.locator(f'#objectLayer [data-object-id="{note_id}"] .kanban-card-body').evaluate("e => ({scrollHeight:e.scrollHeight, clientHeight:e.clientHeight})")
    assert_true(body_metrics["scrollHeight"] <= body_metrics["clientHeight"] + 1, "expanded Kanban card requires internal scrolling")
    expanded_text = card.inner_text()
    for required in ["DESCRIPTION", "SPRINT", "EPIC", "TEAM", "NEED BY", "REPORTER", "ASSIGNEE", "ON HOLD", "NEEDS VP?"]:
        assert_true(required in expanded_text, f"expanded summary omitted {required}")
    assert_true(page.locator(f'#objectLayer [data-object-id="{note_id}"] [data-kanban-read-more]').count() == 1, "long Description did not expose Read more")

    page.locator(f'#objectLayer [data-object-id="{note_id}"] [data-kanban-read-more]').click()
    page.wait_for_timeout(120)
    assert_true(page.locator("#dialog").get_attribute("open") is not None, "Read more did not open the full Description viewer")
    assert_true("complete final sentence" in page.locator("#dialogBody").inner_text().lower(), "full Description viewer lost content")
    page.locator("#dialogClose").click()

    page.locator(f'#objectLayer [data-object-id="{note_id}"] [data-toggle-compact]').click()
    page.wait_for_timeout(150)
    compact = page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id)", note_id)
    assert_true(compact["height"] == 286, "Compact View did not restore the canonical compact height")
    compact_metrics = page.locator(f'#objectLayer [data-object-id="{note_id}"] .kanban-card-body').evaluate("e => ({scrollHeight:e.scrollHeight, clientHeight:e.clientHeight})")
    assert_true(compact_metrics["scrollHeight"] <= compact_metrics["clientHeight"] + 1, "compact Kanban card requires internal scrolling")
    compact_text = card.inner_text()
    assert_true("DESCRIPTION" not in compact_text, "Compact View unexpectedly includes Description")
    for required in ["TEAM", "ASSIGNEE", "NEED BY", "ON HOLD", "NEEDS VP?"]:
        assert_true(required in compact_text, f"Compact View omitted {required}")

    page.locator(f'#objectLayer [data-object-id="{note_id}"] [data-toggle-compact]').click()
    page.wait_for_timeout(150)
    expanded = page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id)", note_id)
    assert_true(expanded["height"] == 474, "Expanded View did not restore the canonical expanded height")

    page.evaluate("id => window.TACKBOARD_DEBUG.selectIds([id])", note_id)
    page.wait_for_timeout(100)
    assert_true(page.locator(f'#objectLayer [data-object-id="{note_id}"] [data-resize="e"]').count() == 1, "Kanban width resize handle is missing")
    assert_true(page.locator(f'#objectLayer [data-object-id="{note_id}"] [data-resize="s"], #objectLayer [data-object-id="{note_id}"] [data-resize="se"]').count() == 0, "Kanban card still exposes vertical resize handles")
    handle = page.locator(f'#objectLayer [data-object-id="{note_id}"] [data-resize="e"]').bounding_box()
    page.mouse.move(handle["x"] + handle["width"] / 2, handle["y"] + handle["height"] / 2)
    page.mouse.down()
    page.mouse.move(handle["x"] + 85, handle["y"] + handle["height"] / 2, steps=5)
    page.mouse.up()
    page.wait_for_timeout(180)
    resized = page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id)", note_id)
    assert_true(resized["width"] > 420, "east handle did not resize Kanban width")
    assert_true(resized["height"] == 474, "width resizing changed the expanded canonical height")
    width_before_keyboard = resized["width"]
    page.keyboard.press("Alt+ArrowDown")
    page.wait_for_timeout(80)
    after_vertical_keyboard = page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id)", note_id)
    assert_true(after_vertical_keyboard["height"] == 474 and after_vertical_keyboard["width"] == width_before_keyboard, "vertical keyboard resize changed a Kanban card")
    page.keyboard.press("Alt+ArrowRight")
    page.wait_for_timeout(100)
    after_horizontal_keyboard = page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id)", note_id)
    assert_true(after_horizontal_keyboard["width"] > width_before_keyboard and after_horizontal_keyboard["height"] == 474, "horizontal keyboard resize did not preserve the Kanban height")

    # Cancel restores values and preserves dimensions.
    page.keyboard.press("Enter")
    page.wait_for_timeout(100)
    assert_true(page.locator("#kanbanEditorBody").evaluate("e => e.scrollTop") == 0, "Kanban editor did not reopen at the first field")
    page.locator('#kanbanEditorSheet [data-kanban-editor-field="ticketNumber"]').fill("CANCEL-ME")
    page.locator("#kanbanEditorCancel").click()
    page.wait_for_timeout(180)
    cancelled = page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id)", note_id)
    assert_true(cancelled["fields"]["ticketNumber"] == "ABC-123", "Cancel did not restore the pre-edit Kanban values")
    assert_true(cancelled["height"] == 474, "Cancel changed the canonical card height")

    # A completed edit is a single undoable action.
    page.keyboard.press("Enter")
    page.locator('#kanbanEditorSheet [data-kanban-editor-field="ticketNumber"]').fill("UNDO-ME")
    page.locator("#kanbanEditorDone").click()
    page.keyboard.press("Control+z")
    page.wait_for_timeout(180)
    undone = page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id)", note_id)
    assert_true(undone["fields"]["ticketNumber"] == "ABC-123", "Undo did not revert the complete editor-sheet change")

    # The two discoverable pointer paths also open the detached editor.
    card.dblclick()
    page.wait_for_timeout(120)
    assert_true(page.locator("#kanbanEditorSheet").is_visible(), "double-click did not open the Kanban editor")
    page.locator("#kanbanEditorCancel").click()
    page.evaluate("id => window.TACKBOARD_DEBUG.selectIds([id])", note_id)
    page.wait_for_timeout(100)
    page.locator('#contextToolbar [data-action="edit"]').click()
    page.wait_for_timeout(120)
    assert_true(page.locator("#kanbanEditorSheet").is_visible(), "Edit Fields did not open the Kanban editor")
    page.keyboard.press("Escape")
    page.wait_for_timeout(100)
    assert_true(not page.locator("#kanbanEditorSheet").is_visible(), "Escape did not finish Kanban editing")

    # Proportional multi-selection resize changes Kanban width but not its canonical height.
    blank_id = page.evaluate("window.TACKBOARD_DEBUG.addBlankNote({x:1180,y:620}).id")
    page.evaluate("ids => window.TACKBOARD_DEBUG.selectIds(ids)", [note_id, blank_id])
    page.wait_for_timeout(120)
    group_handle = page.locator("#selectionBox [data-group-resize]").bounding_box()
    before_group = page.evaluate("ids => ids.map(id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id))", [note_id, blank_id])
    page.mouse.move(group_handle["x"] + group_handle["width"] / 2, group_handle["y"] + group_handle["height"] / 2)
    page.mouse.down()
    page.mouse.move(group_handle["x"] + 70, group_handle["y"] + 70, steps=5)
    page.mouse.up()
    page.wait_for_timeout(160)
    after_group = page.evaluate("ids => ids.map(id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id))", [note_id, blank_id])
    assert_true(after_group[0]["height"] == 474 and after_group[0]["width"] != before_group[0]["width"], "group resize did not preserve the Kanban canonical height")
    assert_true(after_group[1]["width"] != before_group[1]["width"] and after_group[1]["height"] != before_group[1]["height"], "group resize did not scale the companion object")

    clean_errors(page_errors, console_errors, "desktop Kanban presentation")
    page.close()


def run_migration(browser) -> None:
    page = browser.new_page(viewport={"width": 1100, "height": 760})
    page_errors: list[str] = []
    console_errors: list[str] = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.set_content(app_html(), wait_until="load")
    page.wait_for_timeout(220)

    old_board = {
        "format": "tackboard-board",
        "schemaVersion": 2,
        "appVersion": "1.2.2",
        "board": {
            "id": "old-layout-board",
            "name": "Old Layout",
            "description": "",
            "createdAt": "2026-08-18T00:00:00.000Z",
            "modifiedAt": "2026-08-18T00:00:00.000Z",
            "background": "dots",
            "viewport": {"x": 100, "y": 90, "zoom": 1},
            "objects": [
                {
                    "id": "old-kanban",
                    "objectType": "template-note",
                    "templateId": "kanban",
                    "templateVersion": 2,
                    "x": 300,
                    "y": 260,
                    "width": 360,
                    "height": 650,
                    "color": "yellow",
                    "displayMode": "expanded",
                    "zIndex": 1,
                    "rotation": 0,
                    "groupId": None,
                    "frameId": None,
                    "fields": {
                        "ticketNumber": "OLD-1",
                        "ticketType": "Story",
                        "sprintNumber": "",
                        "epic": "",
                        "description": "Old manually sized card",
                        "team": "",
                        "reporter": "",
                        "assignee": "",
                        "status": "Backlog",
                        "onHold": False,
                        "needsVP": False,
                        "needByDate": "",
                    },
                }
            ],
            "connectors": [],
        },
    }
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "old-layout.tackboard.json"
        path.write_text(json.dumps(old_board), encoding="utf-8")
        page.locator("#importInput").set_input_files(str(path))
        page.wait_for_timeout(120)
        page.get_by_role("button", name="Create New Board").click()
        page.wait_for_timeout(240)
    imported = page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id==='old-kanban')")
    assert_true(imported["width"] == 360, "layout migration did not preserve the older card width")
    assert_true(imported["height"] == 474, "layout migration did not replace the older manual height")
    assert_true(imported.get("kanbanLayoutVersion") == 1, "layout migration did not record the new layout version")
    clean_errors(page_errors, console_errors, "Kanban layout migration")
    page.close()


def run_mobile(browser) -> None:
    page = browser.new_page(viewport={"width": 390, "height": 844}, has_touch=True)
    page_errors: list[str] = []
    console_errors: list[str] = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.set_content(app_html(), wait_until="load")
    page.wait_for_timeout(260)
    note_id = page.evaluate("window.TACKBOARD_DEBUG.addKanbanNote({x:600,y:430}).id")
    page.evaluate("id => window.TACKBOARD_DEBUG.openKanbanEditor(id)", note_id)
    page.wait_for_timeout(180)
    sheet = page.locator("#kanbanEditorSheet")
    box = sheet.bounding_box()
    assert_true(sheet.is_visible(), "mobile Kanban editor sheet did not open")
    assert_true(sheet.get_attribute("aria-modal") == "true", "mobile editor is not exposed as a modal bottom sheet")
    assert_true(page.locator("#kanbanEditorBackdrop").is_visible(), "mobile editor backdrop is missing")
    assert_true(box["x"] <= 1 and box["width"] >= 388 and box["y"] + box["height"] >= 842, "mobile editor is not docked to the bottom and full width")
    page.locator("#kanbanEditorDone").focus()
    page.keyboard.press("Tab")
    assert_true(page.evaluate("document.activeElement?.id") == "kanbanEditorClose", "mobile editor focus did not wrap from the final control")
    page.keyboard.press("Shift+Tab")
    assert_true(page.evaluate("document.activeElement?.id") == "kanbanEditorDone", "mobile editor reverse focus did not wrap to the final control")
    card_before = page.locator(f'#objectLayer [data-object-id="{note_id}"]').bounding_box()
    page.locator('#kanbanEditorSheet [data-kanban-editor-field="ticketNumber"]').fill("MOBILE-1")
    page.locator("#kanbanEditorDone").click()
    page.wait_for_timeout(180)
    card_after = page.locator(f'#objectLayer [data-object-id="{note_id}"]').bounding_box()
    assert_true(approx(card_before["height"], card_after["height"], 1.0), "mobile editor changed the board card height")
    clean_errors(page_errors, console_errors, "mobile Kanban editor")
    page.close()


def run() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(**launch_kwargs())
        try:
            run_desktop(browser)
            run_migration(browser)
            run_mobile(browser)
            print("Kanban presentation tests passed.")
        finally:
            browser.close()


if __name__ == "__main__":
    try:
        run()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
