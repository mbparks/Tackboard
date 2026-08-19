#!/usr/bin/env python3
from __future__ import annotations

import sys
import traceback

from playwright.sync_api import sync_playwright

from _support import app_html, approx, assert_true, launch_kwargs


def run() -> None:
    html = app_html()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(**launch_kwargs())

        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page_errors: list[str] = []
        console_errors: list[str] = []
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        try:
            page.set_content(html, wait_until="load")
            page.wait_for_timeout(300)
            assert_true(page.evaluate("window.TACKBOARD_DEBUG.version") == "1.3.0", "visible/debug version mismatch")
            page.evaluate("window.TACKBOARD_DEBUG.loadExampleBoard()")
            page.wait_for_timeout(500)

            # Pan over an object without moving the object.
            page.locator('[data-tool="pan"]').click()
            header = page.locator('[data-object-type="blank-note"]').first.locator(".object-header").bounding_box()
            before = page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard()")
            page.mouse.move(header["x"] + 30, header["y"] + 20)
            page.mouse.down()
            page.mouse.move(header["x"] + 120, header["y"] + 75, steps=6)
            page.mouse.up()
            page.wait_for_timeout(100)
            after = page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard()")
            assert_true(abs(after["viewport"]["x"] - before["viewport"]["x"]) > 40, "Pan tool did not move the viewport")
            assert_true(before["objects"][1]["x"] == after["objects"][1]["x"], "Pan tool moved a board object")

            # Marquee over two notes, including empty-looking frame body space.
            page.locator('[data-tool="select"]').click()
            page.evaluate("window.TACKBOARD_DEBUG.selectIds([])")
            boxes = [page.locator('[data-object-type="blank-note"]').nth(index).bounding_box() for index in range(2)]
            left = min(box["x"] for box in boxes) - 8
            top = min(box["y"] for box in boxes) - 8
            right = max(box["x"] + box["width"] for box in boxes) + 8
            bottom = max(box["y"] + box["height"] for box in boxes) + 8
            page.mouse.move(left, top)
            page.mouse.down()
            page.mouse.move(right, bottom, steps=8)
            page.mouse.up()
            page.wait_for_timeout(150)
            selection = page.evaluate("window.TACKBOARD_DEBUG.getSelection()")
            assert_true(len(selection) >= 2, "Marquee did not select multiple objects")
            assert_true(page.locator("#selectionBox.visible").count() == 1, "Unified multi-selection box is missing")

            # Move and resize the selection through its unified controls.
            objects_before = {
                obj["id"]: (obj["x"], obj["y"])
                for obj in page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().objects")
                if obj["id"] in selection and obj["objectType"] != "drawing"
            }
            label = page.locator("#selectionBoxLabel").bounding_box()
            page.mouse.move(label["x"] + 10, label["y"] + 10)
            page.mouse.down()
            page.mouse.move(label["x"] + 55, label["y"] + 35, steps=5)
            page.mouse.up()
            page.wait_for_timeout(120)
            objects_after = {
                obj["id"]: (obj["x"], obj["y"])
                for obj in page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().objects")
                if obj["id"] in selection and obj["objectType"] != "drawing"
            }
            assert_true(sum(objects_after.get(key) != value for key, value in objects_before.items()) >= 2, "Group movement did not move multiple objects")

            handle = page.locator("#selectionBoxResize").bounding_box()
            sizes_before = {
                obj["id"]: (obj["width"], obj["height"])
                for obj in page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().objects")
                if obj["id"] in selection and obj["objectType"] != "drawing"
            }
            page.mouse.move(handle["x"] + 4, handle["y"] + 4)
            page.mouse.down()
            page.mouse.move(handle["x"] + 70, handle["y"] + 50, steps=5)
            page.mouse.up()
            page.wait_for_timeout(120)
            sizes_after = {
                obj["id"]: (obj["width"], obj["height"])
                for obj in page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().objects")
                if obj["id"] in selection and obj["objectType"] != "drawing"
            }
            assert_true(any(sizes_after[key][0] > value[0] for key, value in sizes_before.items()), "Group resize did not resize objects")

            # Position lock prevents accidental movement.
            lock_id = page.evaluate("ids => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o => ids.includes(o.id))?.id", selection)
            page.evaluate("id => window.TACKBOARD_DEBUG.selectIds([id])", lock_id)
            page.evaluate("window.TACKBOARD_DEBUG.toggleSelectionLock()")
            page.wait_for_timeout(100)
            locked = page.locator(f'[data-object-id="{lock_id}"]')
            drag_handle = locked.locator("[data-drag-handle]").bounding_box()
            position_before = page.evaluate("id => {const o=window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(item=>item.id===id);return [o.x,o.y]}", lock_id)
            page.mouse.move(drag_handle["x"] + 20, drag_handle["y"] + 15)
            page.mouse.down()
            page.mouse.move(drag_handle["x"] + 100, drag_handle["y"] + 60)
            page.mouse.up()
            page.wait_for_timeout(100)
            position_after = page.evaluate("id => {const o=window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(item=>item.id===id);return [o.x,o.y]}", lock_id)
            assert_true(position_before == position_after, "Locked object moved")
            page.evaluate("window.TACKBOARD_DEBUG.toggleSelectionLock()")

            # Frame collapse retains and dims contained content.
            frame_id = page.evaluate('window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.objectType==="frame").id')
            page.evaluate("id => window.TACKBOARD_DEBUG.toggleFrameCollapse(id)", frame_id)
            page.wait_for_timeout(100)
            assert_true(page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id).collapsed", frame_id), "Frame did not collapse")
            assert_true(page.locator(".inside-collapsed-frame").count() > 0, "Collapsed frame did not dim contained content")
            page.evaluate("id => window.TACKBOARD_DEBUG.toggleFrameCollapse(id)", frame_id)

            # Keyboard movement, resizing, focus selection, text color, and explicit Done.
            text_id = page.evaluate('window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.objectType==="text").id')
            page.evaluate("id => window.TACKBOARD_DEBUG.selectIds([id])", text_id)
            page.wait_for_timeout(50)
            x0, width0 = page.evaluate("id => {const o=window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(item=>item.id===id);return [o.x,o.width]}", text_id)
            page.keyboard.press("Shift+ArrowRight")
            page.keyboard.press("Alt+ArrowRight")
            page.wait_for_timeout(120)
            x1, width1 = page.evaluate("id => {const o=window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(item=>item.id===id);return [o.x,o.width]}", text_id)
            assert_true(approx(x1, x0 + 10) and approx(width1, width0 + 1), "Keyboard transform failed")
            page.evaluate('id => document.querySelector(`[data-object-id="${id}"]`).focus()', text_id)
            page.wait_for_timeout(100)
            assert_true(page.locator(f'[data-object-id="{text_id}"]').get_attribute("aria-selected") == "true", "Focused object was not selected")
            assert_true(page.locator('#contextToolbar [data-action="color"]').count() == 1, "Text label color control is missing")
            page.keyboard.press("Enter")
            page.wait_for_timeout(100)
            assert_true(page.locator(f'[data-object-id="{text_id}"] [data-finish-edit]').count() == 1, "Explicit Done control is missing")
            page.locator(f'[data-object-id="{text_id}"] [data-finish-edit]').click()

            # Kanban On Hold checkbox, badge, search, compact view, and filter integration.
            kanban_id = page.evaluate('window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.objectType==="template-note").id')
            page.evaluate("id => window.TACKBOARD_DEBUG.selectIds([id])", kanban_id)
            page.keyboard.press("Enter")
            page.wait_for_timeout(100)
            on_hold = page.locator(f'[data-object-id="{kanban_id}"] [data-kanban-field="onHold"]')
            assert_true(on_hold.count() == 1, "On Hold checkbox is missing from Kanban edit mode")
            assert_true(not on_hold.is_checked(), "On Hold should default to unchecked")
            on_hold.check()
            page.locator(f'[data-object-id="{kanban_id}"] [data-finish-edit]').click()
            page.wait_for_timeout(120)
            assert_true(page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id).fields.onHold", kanban_id), "On Hold value was not stored")
            assert_true(page.locator(f'[data-object-id="{kanban_id}"] .badge.flag-on-hold').inner_text() == "On Hold", "On Hold header badge is missing")

            page.locator(f'[data-object-id="{kanban_id}"] [data-toggle-compact]').click()
            page.wait_for_timeout(100)
            compact_text = page.locator(f'[data-object-id="{kanban_id}"] .kanban-body').inner_text()
            assert_true("ON HOLD" in compact_text and "Yes" in compact_text, "On Hold is missing from Compact View")

            page.locator("#searchButton").click()
            page.fill("#searchInput", "On Hold")
            page.wait_for_timeout(100)
            assert_true("0 results" not in page.locator("#searchCount").inner_text(), "On Hold search did not match the checked Kanban note")
            page.locator("#searchClose").click()

            # Active filter chips and count, including the new On Hold filter.
            page.locator("#filterButton").click()
            page.select_option("#filterTeam", "SPA")
            page.select_option("#filterOnHold", "yes")
            page.locator('#filterForm button[type="submit"]').click()
            page.wait_for_timeout(120)
            assert_true(page.locator("#activeFilterBar.visible").count() == 1, "Active filter bar is missing")
            assert_true(page.locator('[data-clear-filter="team"]').count() == 1, "Team filter chip is missing")
            assert_true(page.locator('[data-clear-filter="onHold"]').count() == 1, "On Hold filter chip is missing")
            page.locator('[data-clear-filter="team"]').click()
            page.locator('[data-clear-filter="onHold"]').click()
            page.wait_for_timeout(80)
            assert_true(page.locator("#activeFilterBar.visible").count() == 0, "Filter chips did not clear")

            # Clear Fields resets On Hold, and conversion preserves it as readable text.
            page.evaluate("id => window.TACKBOARD_DEBUG.selectIds([id])", kanban_id)
            page.locator('#contextToolbar [data-action="more"]').click()
            page.locator('[data-pop-action="clear-kanban"]').click()
            page.locator('dialog[open] [data-dialog-value="1"]').click()
            page.wait_for_timeout(120)
            assert_true(not page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id).fields.onHold", kanban_id), "Clear Field Values did not reset On Hold")
            page.evaluate("window.TACKBOARD_DEBUG.undo()")
            page.wait_for_timeout(120)
            assert_true(page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id).fields.onHold", kanban_id), "Undo did not restore On Hold")

            page.evaluate("id => window.TACKBOARD_DEBUG.selectIds([id])", kanban_id)
            page.locator('#contextToolbar [data-action="more"]').click()
            page.locator('[data-pop-action="convert-kanban"]').click()
            page.locator('dialog[open] [data-dialog-value="1"]').click()
            page.wait_for_timeout(120)
            converted = page.evaluate("id => window.TACKBOARD_DEBUG.getCurrentBoard().objects.find(o=>o.id===id)", kanban_id)
            assert_true(converted["objectType"] == "blank-note" and "On Hold: Yes" in converted["content"], "Kanban conversion did not preserve On Hold")
            page.evaluate("window.TACKBOARD_DEBUG.undo()")
            page.wait_for_timeout(120)

            # Keyboard-operable popover and focus return.
            page.locator("#boardButton").click()
            page.wait_for_timeout(100)
            page.keyboard.press("ArrowDown")
            page.keyboard.press("Escape")
            page.wait_for_timeout(80)
            assert_true(page.locator("#popover.hidden").count() == 1, "Popover did not close with Escape")
            assert_true(page.evaluate('document.activeElement===document.querySelector("#boardButton")'), "Focus did not return to the invoking control")

            # Selected-area export enters crop mode and presents a preview.
            page.locator("#exportButton").click()
            page.locator('[data-pop-action="export-png-area"]').click()
            viewport = page.locator("#viewport").bounding_box()
            page.mouse.move(viewport["x"] + 300, viewport["y"] + 220)
            page.mouse.down()
            page.mouse.move(viewport["x"] + 700, viewport["y"] + 520, steps=5)
            page.mouse.up()
            page.wait_for_timeout(200)
            assert_true(page.locator("dialog[open] .export-preview-grid").count() == 1, "Export preview is missing")
            page.locator('dialog[open] [data-dialog-value="0"]').click()

            # Default export setting controls Quick Export.
            page.locator("#settingsButton").click()
            page.select_option("#settingExportFormat", "json")
            page.locator('dialog[open] [data-dialog-value="1"]').click()
            page.wait_for_timeout(150)
            page.locator("#exportButton").click()
            assert_true("JSON" in page.locator('[data-pop-action="quick-export"] .menu-title').inner_text(), "Quick Export did not use the default format")
            page.keyboard.press("Escape")

            # Undo histories survive board switching and remain board-specific.
            board_a = page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().id")
            original_count = page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().objects.length")
            page.evaluate("window.TACKBOARD_DEBUG.addBlankNote({x:1800,y:900})")
            board_b = page.evaluate('window.TACKBOARD_DEBUG.createBoardDirect("Board B")')
            page.evaluate("window.TACKBOARD_DEBUG.addBlankNote({x:400,y:400})")
            page.evaluate("id => window.TACKBOARD_DEBUG.switchBoard(id)", board_a)
            page.evaluate("window.TACKBOARD_DEBUG.undo()")
            assert_true(page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().objects.length") == original_count, "Board A undo history was lost")
            page.evaluate("id => window.TACKBOARD_DEBUG.switchBoard(id)", board_b)
            page.evaluate("window.TACKBOARD_DEBUG.undo()")
            assert_true(page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().objects.length") == 0, "Board B undo history was not independent")

            # Persistent save error and successful retry.
            page.evaluate('window.__oldSetItem=localStorage.setItem;Object.defineProperty(localStorage,"setItem",{configurable:true,value:()=>{throw new Error("quota test")}});void 0')
            page.evaluate("window.TACKBOARD_DEBUG.addBlankNote({x:500,y:500});window.TACKBOARD_DEBUG.saveNow()")
            page.wait_for_timeout(250)
            assert_true(page.locator("#saveErrorBanner.visible").count() == 1, "Persistent save warning is missing")
            page.evaluate('Object.defineProperty(localStorage,"setItem",{configurable:true,value:window.__oldSetItem});void 0')
            page.locator("#retrySaveButton").click()
            page.wait_for_timeout(250)
            assert_true(page.locator("#saveErrorBanner.visible").count() == 0, "Save retry did not clear the warning")

            # localStorage fallback survives a document reload.
            board_count = page.evaluate("window.TACKBOARD_DEBUG.getState().boards.length")
            page.evaluate("window.TACKBOARD_DEBUG.saveNow()")
            page.wait_for_timeout(180)
            page.set_content(html, wait_until="load")
            page.wait_for_timeout(500)
            assert_true(page.evaluate("window.TACKBOARD_DEBUG.getState().boards.length") == board_count, "Fallback persistence did not restore boards")

            if page_errors:
                raise AssertionError(f"Desktop page errors: {page_errors}")
            unexpected_console = [error for error in console_errors if "save error" not in error.lower()]
            if unexpected_console:
                raise AssertionError(f"Desktop console errors: {unexpected_console}")
            print("Desktop interaction tests passed.")
        finally:
            page.close()

        # Touch/mobile regression pass.
        page = browser.new_page(viewport={"width": 390, "height": 844}, has_touch=True)
        page_errors = []
        console_errors = []
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        try:
            page.set_content(html, wait_until="load")
            page.wait_for_timeout(250)
            page.evaluate("window.TACKBOARD_DEBUG.loadExampleBoard()")
            page.wait_for_timeout(400)
            page.evaluate("window.TACKBOARD_DEBUG.overviewContent()")
            assert_true(page.locator("#mobileMenuButton").is_visible(), "Mobile menu button is missing")
            assert_true(page.locator("#touchAddButton").is_visible(), "Touch Add Selection button is missing")

            def dispatch(kind: str, x: float, y: float, pointer_id: int = 51) -> None:
                page.evaluate(
                    """([kind,x,y,pid])=>{const target=kind==='pointerdown'?document.elementFromPoint(x,y):window;target.dispatchEvent(new PointerEvent(kind,{bubbles:true,cancelable:true,pointerId:pid,pointerType:'touch',button:0,buttons:kind==='pointerup'?0:1,clientX:x,clientY:y,isPrimary:true}));}""",
                    [kind, x, y, pointer_id],
                )

            page.locator('[data-tool="pan"]').click()
            viewport_before = page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().viewport")
            dispatch("pointerdown", 190, 420)
            dispatch("pointermove", 250, 475)
            dispatch("pointerup", 250, 475)
            page.wait_for_timeout(100)
            viewport_after = page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().viewport")
            assert_true(abs(viewport_after["x"] - viewport_before["x"]) > 20, "One-finger Pan mode failed")

            page.locator('[data-tool="select"]').click()
            page.evaluate("window.TACKBOARD_DEBUG.selectIds([])")
            dispatch("pointerdown", 40, 300, 61)
            dispatch("pointermove", 360, 620, 61)
            dispatch("pointerup", 360, 620, 61)
            page.wait_for_timeout(150)
            assert_true(len(page.evaluate("window.TACKBOARD_DEBUG.getSelection()")) >= 2, "One-finger touch marquee failed")

            page.locator("#touchAddButton").click()
            assert_true(page.locator("#touchAddButton").get_attribute("aria-pressed") == "true", "Touch additive selection did not activate")
            target = page.locator("[data-object-id]").nth(1).bounding_box()
            dispatch("pointerdown", target["x"] + 10, target["y"] + 10, 71)
            page.wait_for_timeout(650)
            assert_true(page.locator("#popover:not(.hidden)").count() == 1, "Touch long-press More menu did not open")
            page.keyboard.press("Escape")

            zoom_before = page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().viewport.zoom")
            dispatch("pointerdown", 140, 450, 81)
            dispatch("pointerdown", 240, 450, 82)
            dispatch("pointermove", 100, 450, 81)
            dispatch("pointermove", 280, 450, 82)
            dispatch("pointerup", 100, 450, 81)
            dispatch("pointerup", 280, 450, 82)
            page.wait_for_timeout(120)
            zoom_after = page.evaluate("window.TACKBOARD_DEBUG.getCurrentBoard().viewport.zoom")
            assert_true(abs(zoom_after - zoom_before) > 0.01, "Two-finger pinch zoom failed")

            page.locator("#mobileMenuButton").click()
            assert_true(page.locator("#popover.mobile-sheet:not(.hidden)").count() == 1, "Mobile bottom sheet did not open")

            if page_errors:
                raise AssertionError(f"Mobile page errors: {page_errors}")
            unexpected_console = [error for error in console_errors if "save error" not in error.lower()]
            if unexpected_console:
                raise AssertionError(f"Mobile console errors: {unexpected_console}")
            print("Mobile interaction tests passed.")
        finally:
            page.close()
            browser.close()


if __name__ == "__main__":
    try:
        run()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
