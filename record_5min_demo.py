#!/usr/bin/env python3
"""
Automated 5-minute Screen Recording Script for Recovery Demo.
Generates an uncompressed high-definition 1080p MP4 recording
following the exact 5-minute pitch script with visible cursor animations.
"""

import os
import sys
import time
import subprocess
from playwright.sync_api import sync_playwright

VIDEO_DIR = "/Users/baleshwarpandit/.gemini/antigravity/scratch/ai-revenue-recovery/raw_video"
OUTPUT_MP4 = "/Users/baleshwarpandit/.gemini/antigravity/scratch/ai-revenue-recovery/recovery_5min_pitch_demo.mp4"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

os.makedirs(VIDEO_DIR, exist_ok=True)

def inject_visual_cursor(page):
    page.evaluate("""() => {
        if (document.getElementById('recording-cursor')) return;
        const cursor = document.createElement('div');
        cursor.id = 'recording-cursor';
        cursor.style.width = '24px';
        cursor.style.height = '24px';
        cursor.style.border = '2.5px solid #2563EB';
        cursor.style.backgroundColor = 'rgba(37, 99, 235, 0.3)';
        cursor.style.borderRadius = '50%';
        cursor.style.position = 'fixed';
        cursor.style.pointerEvents = 'none';
        cursor.style.zIndex = '999999';
        cursor.style.transition = 'transform 0.1s ease, background-color 0.1s ease, border-color 0.1s ease';
        cursor.style.transform = 'translate(-50%, -50%)';
        cursor.style.boxShadow = '0 0 12px rgba(37, 99, 235, 0.5)';
        cursor.style.left = '500px';
        cursor.style.top = '300px';
        document.body.appendChild(cursor);

        const dot = document.createElement('div');
        dot.id = 'recording-dot';
        dot.style.width = '6px';
        dot.style.height = '6px';
        dot.style.backgroundColor = '#2563EB';
        dot.style.borderRadius = '50%';
        dot.style.position = 'absolute';
        dot.style.top = '50%';
        dot.style.left = '50%';
        dot.style.transform = 'translate(-50%, -50%)';
        cursor.appendChild(dot);

        window.addEventListener('mousemove', (e) => {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
        });
        window.addEventListener('mousedown', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(0.75)';
            cursor.style.backgroundColor = 'rgba(220, 38, 38, 0.6)';
            cursor.style.borderColor = '#DC2626';
            dot.style.backgroundColor = '#DC2626';
        });
        window.addEventListener('mouseup', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursor.style.backgroundColor = 'rgba(37, 99, 235, 0.3)';
            cursor.style.borderColor = '#2563EB';
            dot.style.backgroundColor = '#2563EB';
        });
    }""")

def smooth_move(page, start_x, start_y, end_x, end_y, steps=25, delay=0.015):
    for i in range(1, steps + 1):
        x = start_x + (end_x - start_x) * (i / steps)
        y = start_y + (end_y - start_y) * (i / steps)
        page.mouse.move(x, y)
        time.sleep(delay)
    return end_x, end_y

def move_to_element(page, selector, current_pos=(500, 300), steps=25):
    el = page.locator(selector).first
    if el.count() > 0 and el.is_visible():
        box = el.bounding_box()
        if box:
            target_x = box['x'] + box['width'] / 2
            target_y = box['y'] + box['height'] / 2
            return smooth_move(page, current_pos[0], current_pos[1], target_x, target_y, steps=steps)
    return current_pos

def click_element(page, selector, current_pos=(500, 300), steps=25):
    pos = move_to_element(page, selector, current_pos, steps=steps)
    time.sleep(0.15)
    page.mouse.down()
    time.sleep(0.12)
    page.mouse.up()
    time.sleep(0.2)
    return pos

def record_full_demo():
    print("🚀 Starting 5-minute automated demo recording...")
    start_time = time.time()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--enable-features=OverlayScrollbar", "--hide-scrollbars=false"]
        )
        context = browser.new_context(
            record_video_dir=VIDEO_DIR,
            record_video_size={"width": 1920, "height": 1080},
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1,
        )
        page = context.new_page()

        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        inject_visual_cursor(page)

        pos = (960, 540)
        page.mouse.move(*pos)

        # =========================================================================
        # PART 1: The Hook & The Problem (0:00 - 0:40 | ~40 seconds)
        # =========================================================================
        print("🎬 Part 1: Overview & Problem Statement (0:00 - 0:40)...")
        # Hover over Brand Header
        pos = smooth_move(page, pos[0], pos[1], 160, 35, steps=30)
        time.sleep(4)

        # Move across the 4 primary KPI cards
        pos = smooth_move(page, pos[0], pos[1], 350, 160, steps=35)  # Revenue at Risk
        time.sleep(3.5)
        pos = smooth_move(page, pos[0], pos[1], 650, 160, steps=30)  # Revenue Recovered
        time.sleep(3.5)
        pos = smooth_move(page, pos[0], pos[1], 950, 160, steps=30)  # Net Profit / Multiplier
        time.sleep(3.5)
        pos = smooth_move(page, pos[0], pos[1], 1250, 160, steps=30) # Compliance Stops
        time.sleep(3.5)

        # Scroll down to show the 5-Step Recovery Conversion Funnel
        page.mouse.wheel(0, 380)
        time.sleep(2)
        inject_visual_cursor(page)
        pos = smooth_move(page, pos[0], pos[1], 700, 380, steps=35)
        time.sleep(5)

        # Hover over Root Cause Diagnosis breakdown
        page.mouse.wheel(0, 350)
        time.sleep(2)
        inject_visual_cursor(page)
        pos = smooth_move(page, pos[0], pos[1], 500, 550, steps=30)
        time.sleep(4)

        # Click on AI Prompt Bar: "Why did carts drop?"
        prompt_btn = page.locator("button:has-text('Why did carts drop?')").first
        if prompt_btn.count() > 0:
            pos = click_element(page, "button:has-text('Why did carts drop?')", pos, steps=25)
            time.sleep(4)

        # Scroll back up to the top
        page.mouse.wheel(0, -900)
        time.sleep(2)
        inject_visual_cursor(page)
        pos = smooth_move(page, pos[0], pos[1], 960, 300, steps=25)
        time.sleep(3)

        # Target time check for Part 1
        elapsed = time.time() - start_time
        if elapsed < 40:
            time.sleep(40 - elapsed)

        # =========================================================================
        # PART 2: Live Ops & 6-Agent LangGraph Machine (0:40 - 1:40 | ~60 seconds)
        # =========================================================================
        print("🎬 Part 2: Live Ops & 6-Agent State Machine (0:40 - 1:40)...")
        # Click Interventions Tab
        pos = click_element(page, "button:has-text('Interventions')", pos, steps=25)
        time.sleep(2)
        inject_visual_cursor(page)

        # Pan across the 6 Agent Nodes on screen
        # Node 1: Signal Ingestion
        pos = smooth_move(page, pos[0], pos[1], 250, 180, steps=30)
        time.sleep(2.5)
        # Node 2: Root Cause Diagnosis
        pos = smooth_move(page, pos[0], pos[1], 480, 180, steps=25)
        time.sleep(2.5)
        # Node 3: Strategy Selection
        pos = smooth_move(page, pos[0], pos[1], 720, 180, steps=25)
        time.sleep(2.5)
        # Node 4: Compliance Guardrail
        pos = smooth_move(page, pos[0], pos[1], 960, 180, steps=25)
        time.sleep(3)
        # Node 5 & 6: Execution & Audit
        pos = smooth_move(page, pos[0], pos[1], 1200, 180, steps=25)
        time.sleep(2.5)

        # Select 5x Speed
        pos = click_element(page, "button:has-text('5x')", pos, steps=25)
        time.sleep(1)

        # Click Start Batch!
        start_btn = page.locator("button:has-text('Start Batch')").first
        if start_btn.count() > 0 and start_btn.is_visible():
            pos = click_element(page, "button:has-text('Start Batch')", pos, steps=25)
        else:
            resume_btn = page.locator("button:has-text('Resume')").first
            if resume_btn.count() > 0:
                pos = click_element(page, "button:has-text('Resume')", pos, steps=25)
        time.sleep(4)

        # Watch traces and cases stream across the screen
        pos = smooth_move(page, pos[0], pos[1], 500, 420, steps=30)
        time.sleep(8)

        # Pause simulation to inspect a specific case drawer
        pause_btn = page.locator("button:has-text('Pause')").first
        if pause_btn.count() > 0 and pause_btn.is_visible():
            pos = click_element(page, "button:has-text('Pause')", pos, steps=20)
            time.sleep(1.5)

        # Click on a case row in the Live Ops feed to open CaseDrawer
        case_row = page.locator("tr").nth(2)
        if case_row.count() > 0:
            box = case_row.bounding_box()
            if box:
                pos = smooth_move(page, pos[0], pos[1], box['x'] + 200, box['y'] + 20, steps=25)
                page.mouse.click(*pos)
                time.sleep(3)

        # Inside CaseDrawer:
        # Tab 1: Timeline is open
        time.sleep(3)

        # Tab 2: WhatsApp Simulated Thread
        whatsapp_tab = page.locator("button:has-text('WhatsApp')").first
        if whatsapp_tab.count() > 0 and whatsapp_tab.is_visible():
            pos = click_element(page, "button:has-text('WhatsApp')", pos, steps=20)
            time.sleep(4)

        # Tab 3: Hinglish Voice Script Player
        voice_tab = page.locator("button:has-text('Voice Script')").first
        if voice_tab.count() > 0 and voice_tab.is_visible():
            pos = click_element(page, "button:has-text('Voice Script')", pos, steps=20)
            time.sleep(3)

        # Tab 4: Compliance Check Breakdown
        comp_drawer_tab = page.locator("button:has-text('Compliance')").first
        if comp_drawer_tab.count() > 0 and comp_drawer_tab.is_visible():
            pos = click_element(page, "button:has-text('Compliance')", pos, steps=20)
            time.sleep(4)

        # Close CaseDrawer
        close_btn = page.locator("button[title='Close Drawer'], button:has-text('✕')").first
        if close_btn.count() > 0 and close_btn.is_visible():
            pos = click_element(page, "button[title='Close Drawer'], button:has-text('✕')", pos, steps=20)
        else:
            page.keyboard.press("Escape")
        time.sleep(2)

        # Resume simulation so processing continues
        resume_btn = page.locator("button:has-text('Resume')").first
        if resume_btn.count() > 0 and resume_btn.is_visible():
            pos = click_element(page, "button:has-text('Resume')", pos, steps=20)
            time.sleep(2)

        # Target time check for Part 2
        elapsed = time.time() - start_time
        if elapsed < 100:
            time.sleep(100 - elapsed)

        # =========================================================================
        # PART 3: Pre-Execution Compliance Gate (1:40 - 2:40 | ~60 seconds)
        # =========================================================================
        print("🎬 Part 3: Compliance Gate & Sandbox (1:40 - 2:40)...")
        # Click Compliance Tab
        pos = click_element(page, "button:has-text('Compliance')", pos, steps=25)
        time.sleep(2.5)
        inject_visual_cursor(page)

        # Move mouse across the 7 policy cards
        pos = smooth_move(page, pos[0], pos[1], 300, 220, steps=30) # TRAI DND
        time.sleep(3)
        pos = smooth_move(page, pos[0], pos[1], 650, 220, steps=25) # Quiet Hours
        time.sleep(3)
        pos = smooth_move(page, pos[0], pos[1], 1000, 220, steps=25) # 24h Frequency Cap
        time.sleep(3)
        pos = smooth_move(page, pos[0], pos[1], 1350, 220, steps=25) # Card Retry Cap
        time.sleep(3)

        # Scroll to Interactive Compliance Sandbox
        page.mouse.wheel(0, 480)
        time.sleep(2)
        inject_visual_cursor(page)

        # Adjust Local Hour Slider to 22:00 (Quiet Hours trigger)
        sliders = page.locator("input[type='range']")
        if sliders.count() > 0:
            box = sliders.first.bounding_box()
            if box:
                # Drag slider to the right
                pos = smooth_move(page, pos[0], pos[1], box['x'] + 50, box['y'] + 10, steps=25)
                page.mouse.down()
                pos = smooth_move(page, pos[0], pos[1], box['x'] + box['width'] * 0.88, box['y'] + 10, steps=30)
                page.mouse.up()
                time.sleep(4)

        # Click on "Inject Event" button in Header
        pos = click_element(page, "button:has-text('Inject Event')", pos, steps=25)
        time.sleep(2.5)

        # Inside InjectCaseModal:
        # Select "Late-Night Quiet Hours" preset
        quiet_preset = page.locator("button:has-text('Late-Night Quiet Hours')").first
        if quiet_preset.count() > 0 and quiet_preset.is_visible():
            pos = click_element(page, "button:has-text('Late-Night Quiet Hours')", pos, steps=25)
            time.sleep(3)

        # Click "Inject Case" button
        inject_submit = page.locator("button:has-text('Inject Case')").first
        if inject_submit.count() > 0 and inject_submit.is_visible():
            pos = click_element(page, "button:has-text('Inject Case')", pos, steps=25)
            time.sleep(4)

        # Watch the VETO verdict in the CaseDrawer
        time.sleep(5)
        # Close drawer
        page.keyboard.press("Escape")
        time.sleep(2)

        # Scroll back up
        page.mouse.wheel(0, -500)
        time.sleep(2)

        # Target time check for Part 3
        elapsed = time.time() - start_time
        if elapsed < 160:
            time.sleep(160 - elapsed)

        # =========================================================================
        # PART 4: Cryptographic SHA-256 Audit Trail (2:40 - 3:40 | ~60 seconds)
        # =========================================================================
        print("🎬 Part 4: Cryptographic SHA-256 Audit Trail (2:40 - 3:40)...")
        # Execute instant batch completion to ensure all 300 cases & 1,755 audit entries are written
        instant_btn = page.locator("button:has-text('Instant')").first
        if instant_btn.count() > 0 and instant_btn.is_visible():
            pos = click_element(page, "button:has-text('Instant')", pos, steps=20)
            time.sleep(3)

        # Click Audit Log Tab
        pos = click_element(page, "button:has-text('Audit Log')", pos, steps=25)
        time.sleep(3)
        inject_visual_cursor(page)

        # View Audit Table entries
        pos = smooth_move(page, pos[0], pos[1], 600, 320, steps=30)
        time.sleep(4)

        # Filter by Status: "Blocked / Vetoed Only"
        status_select = page.locator("select").first
        if status_select.count() > 0 and status_select.is_visible():
            pos = move_to_element(page, "select", pos, steps=20)
            status_select.select_option("BLOCKED")
            time.sleep(4)
            # Reset back to ALL
            status_select.select_option("ALL")
            time.sleep(3)

        # Click an entry to expand structured payload
        expand_btn = page.locator("button[title='Expand structured payload']").first
        if expand_btn.count() > 0 and expand_btn.is_visible():
            pos = click_element(page, "button[title='Expand structured payload']", pos, steps=20)
            time.sleep(4)

        # Click the "Verify Hash Chain" Button!
        verify_btn = page.locator("button:has-text('Verify Hash Chain')").first
        if verify_btn.count() > 0 and verify_btn.is_visible():
            pos = click_element(page, "button:has-text('Verify Hash Chain')", pos, steps=25)
            time.sleep(4)

            # Inside Verification Modal:
            # Hover over Genesis Hash, Chain Head, and Tampered Count
            pos = smooth_move(page, pos[0], pos[1], 960, 520, steps=30)
            time.sleep(6)

            # Close Verification Modal
            close_verify = page.locator("button:has-text('Close Verification')").first
            if close_verify.count() > 0 and close_verify.is_visible():
                pos = click_element(page, "button:has-text('Close Verification')", pos, steps=25)
                time.sleep(2)

        # Hover over "Export CSV"
        export_btn = page.locator("a:has-text('Export CSV')").first
        if export_btn.count() > 0 and export_btn.is_visible():
            pos = move_to_element(page, "a:has-text('Export CSV')", pos, steps=25)
            time.sleep(4)

        # Target time check for Part 4
        elapsed = time.time() - start_time
        if elapsed < 220:
            time.sleep(220 - elapsed)

        # =========================================================================
        # PART 5: Financial Funnel & Proven Numbers (3:40 - 4:40 | ~60 seconds)
        # =========================================================================
        print("🎬 Part 5: Financial Funnel & Proven Numbers (3:40 - 4:40)...")
        # Click Reports Tab (Analytics)
        pos = click_element(page, "button:has-text('Reports')", pos, steps=25)
        time.sleep(3)
        inject_visual_cursor(page)

        # View the Waterfall Chart
        pos = smooth_move(page, pos[0], pos[1], 450, 300, steps=35)
        time.sleep(5)
        pos = smooth_move(page, pos[0], pos[1], 950, 300, steps=35)
        time.sleep(5)

        # Scroll down to Channel Performance breakdown
        page.mouse.wheel(0, 420)
        time.sleep(2)
        inject_visual_cursor(page)
        pos = smooth_move(page, pos[0], pos[1], 600, 420, steps=30)
        time.sleep(5)

        # Scroll to Interactive Annual ROI Simulator
        page.mouse.wheel(0, 400)
        time.sleep(2)
        inject_visual_cursor(page)

        # Move Monthly Volume Slider
        analytics_sliders = page.locator("input[type='range']")
        if analytics_sliders.count() > 0:
            box = analytics_sliders.first.bounding_box()
            if box:
                pos = smooth_move(page, pos[0], pos[1], box['x'] + 20, box['y'] + 10, steps=25)
                page.mouse.down()
                pos = smooth_move(page, pos[0], pos[1], box['x'] + box['width'] * 0.75, box['y'] + 10, steps=30)
                page.mouse.up()
                time.sleep(5)

        # Highlight Annual Net Savings
        pos = smooth_move(page, pos[0], pos[1], 1150, 520, steps=30)
        time.sleep(6)

        # Scroll back to top
        page.mouse.wheel(0, -900)
        time.sleep(2)

        # Target time check for Part 5
        elapsed = time.time() - start_time
        if elapsed < 280:
            time.sleep(280 - elapsed)

        # =========================================================================
        # PART 6: Closing & Final Verification (4:40 - 5:00 | ~20 seconds)
        # =========================================================================
        print("🎬 Part 6: Closing Summary (4:40 - 5:00)...")
        # Return to Overview Tab
        pos = click_element(page, "button:has-text('Overview')", pos, steps=25)
        time.sleep(2)
        inject_visual_cursor(page)

        # Open Date Range Picker
        date_btn = page.locator("button:has-text('Oct 1')").first
        if date_btn.count() > 0 and date_btn.is_visible():
            pos = click_element(page, "button:has-text('Oct 1')", pos, steps=25)
            time.sleep(3)
            page.keyboard.press("Escape")
            time.sleep(1)

        # Smoothly rest cursor on the Brand Logo / Primary Recovery Rate Metric
        pos = smooth_move(page, pos[0], pos[1], 650, 160, steps=30)

        # Wait until exactly 300.0 seconds
        total_elapsed = time.time() - start_time
        if total_elapsed < 300:
            time.sleep(300 - total_elapsed)

        print(f"🎉 300 seconds completed! Total runtime: {time.time() - start_time:.2f}s")
        context.close()
        browser.close()

    # Convert to MP4 with FFmpeg
    raw_files = [f for f in os.listdir(VIDEO_DIR) if f.endswith(".webm")]
    if raw_files:
        latest_webm = os.path.join(VIDEO_DIR, sorted(raw_files)[-1])
        print(f"Converting {latest_webm} to high-quality 1080p MP4: {OUTPUT_MP4}...")
        cmd = [
            "/opt/homebrew/bin/ffmpeg", "-y",
            "-i", latest_webm,
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            OUTPUT_MP4
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            size_mb = os.path.getsize(OUTPUT_MP4) / (1024 * 1024)
            print(f"✅ SUCCESS! Generated MP4 video: {OUTPUT_MP4} ({size_mb:.2f} MB)")
        else:
            print(f"❌ FFmpeg error: {res.stderr}")
    else:
        print("❌ No webm file found in video directory.")

if __name__ == "__main__":
    record_full_demo()
