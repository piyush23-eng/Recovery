# Recovery — Pitch & Demo Scripts

This document contains both the **2-Minute Executive Pitch** and the comprehensive **5-Minute Word-for-Word Voiceover Script** matching [`recovery_5min_pitch_demo.mp4`](./recovery_5min_pitch_demo.mp4) and [`record_5min_demo.py`](./record_5min_demo.py).

---

## ⏱️ Section 1: The 2-Minute Executive Pitch

### 1. Opening Hook (0:00 – 0:25)
> *"Most payment recovery solutions are just dumb notification spammers or generic chatbots that harass customers and violate compliance rules. What you're seeing today is **Recovery** — an autonomous, closed-loop multi-agent system built on FastAPI and LangGraph that detects revenue at risk, diagnoses root causes, selects compliant interventions, and enforces hard regulatory guardrails with a cryptographic append-only audit trail."*

### 2. Live Ops & 6-Agent LangGraph (0:25 – 0:50)
> *"On the **Interventions** tab, watch our 300-event batch stream live. Notice how every single transaction transitions through a deterministic 6-agent finite state machine. For a customer whose UPI AutoPay failed due to a transient bank switch timeout, our Strategy agent formulates an instant smart retry. For an expired card or dropped cart, it generates localized Hinglish WhatsApp copy with a 1-click Razorpay UPI intent link."*

### 3. The Unbreakable Compliance Gate (0:50 – 1:20)
> *"Here is what makes this truly production-grade for regulated fintechs: **The Compliance Guardrail Agent**. Look at these red badges — when a customer is flagged on the simulated National DND registry, or when local time hits 9:00 PM quiet hours, the guardrail visibly **vetoes** the action before any customer message can be sent. We also enforce a 3-retry cap and auto-escalate disputed B2B invoices over ₹50,000 directly to credit desks."*

### 4. Overview Funnel & Reconciled Numbers (1:20 – 1:45)
> *"On the **Overview** dashboard, our 5-step recovery funnel shows live conversion from Detected to Recovered with diagonal-hatched sparklines. Across this 300-event benchmark batch, we recovered **₹17.3 Lakhs** out of **₹33.4 Lakhs** at risk — achieving a defensible **51.6% deterministic recovery rate**, an **8,799x ROI multiplier**, and **45 compliance stops** strictly enforced."*

### 5. Proof & Closing (1:45 – 2:00)
> *"On the **Audit Log** tab, every single decision — including the cryptographic SHA-256 hash-chain verifying 1,755 unbroken entries from genesis — is immutably logged and exportable with one click to CSV. This is bounded, autonomous, compliant revenue recovery."*

---

## 🎙️ Section 2: The 5-Minute Word-for-Word Voiceover Script

> **Recording Reference**: Matches [`recovery_5min_pitch_demo.mp4`](./recovery_5min_pitch_demo.mp4) (1080p, 60fps, 300.0 seconds).

```
================================================================================
PART 1: THE CORE PROBLEM & EXECUTIVE DASHBOARD (0:00 – 0:40 | 40s)
================================================================================
[VISUAL CUE]: The blue halo cursor hovers on the top brand header, then glides
across the 4 KPI cards: Revenue at Risk, Revenue Recovered, Net ROI Multiplier,
and Compliance Stops. It scrolls down to the 5-Step Funnel and AI Query Bar.

[VOICEOVER]:
"Welcome to Recovery — an autonomous, multi-agent AI revenue recovery platform
engineered for modern digital commerce and fintech.

In modern payments, revenue leakage rarely happens all at once. It degrades
progressively across four distinct failure vectors: checkout cart drop-offs,
payment gateway timeouts, recurring subscription mandate failures, and aging
B2B receivables.

Existing solutions either blast generic SMS notifications that spam users and
violate TRAI DND regulations, or leave unpaid invoices sitting dormant for weeks.

Recovery solves this by replacing dumb notification blasts with a closed-loop,
deterministic 6-stage finite state machine.

Here on our Overview dashboard, you can see the real-time financial totals across
our benchmark dataset: ₹33.4 Lakhs of total revenue at risk, ₹17.25 Lakhs
recovered at a 51.6% recovery rate, with an 8,799x net ROI multiplier, and 45
compliance stops enforced with zero infractions.

Looking at the 5-step conversion funnel, every transaction is tracked from
Detection through Diagnosis, Strategy Selection, Compliance Hard Gates, and final
Settlement. Users can even ask natural language questions through our exploration
bar to instantly uncover failure root causes."
```

```
================================================================================
PART 2: LIVE OPS & THE 6-AGENT LANGGRAPH STATE MACHINE (0:40 – 1:40 | 60s)
================================================================================
[VISUAL CUE]: The cursor clicks 'Interventions' in the navbar. It sweeps
across the 6 horizontal agent nodes at the top. The 5x speed button is selected,
and 'Start Batch' is clicked. Cases stream in real time. The user clicks 'Pause'
and opens an individual Case Drawer, exploring the WhatsApp thread, Hinglish voice
player with Neural Voice Engine badge, and compliance breakdown.

[VOICEOVER]:
"Let's jump into the heart of the engine: the Live Ops interface on our
Interventions tab.

Across the top is our compiled LangGraph StateGraph, orchestrating six specialized
recovery agents:
1. The Signal Ingestion Agent normalizes raw incoming telemetry across all rails.
2. The Root Cause Diagnosis Agent classifies failures into seven taxonomy buckets.
3. The Strategy Selection Agent formulates tailored recovery actions.
4. The Compliance Guardrail Agent evaluates statutory hard gates before any touch.
5. The Execution Agent handles bounded outreach and unit-economics spend.
6. The Outcome and Audit Agent reconciles cash recovery and records immutable proofs.

Let's accelerate the batch to 5x speed and start processing. Watch as individual
transactions flow through the state machine with live sub-millisecond trace payloads.

Let's pause here and inspect an individual case drawer.

Notice the clean, solid slide-over interface. In the WhatsApp tab, Recovery has
composed a contextual message equipped with an instant 1-tap UPI deep link
powered by Razorpay.

Down below is our Hinglish Voice Recovery Agent, powered by our Neural Voice Engine.
It synthesizes natural, localized voice outreach with full browser audio playback
and dynamic audio waveforms.

Every touchpoint is designed for maximum recovery conversion while respecting
strict communication boundaries."
```

```
================================================================================
PART 3: PRE-EXECUTION COMPLIANCE HARD GATES & INJECTION (1:40 – 2:40 | 60s)
================================================================================
[VISUAL CUE]: Cursor clicks the 'Compliance' tab in the navbar. It glides across
the 7 compliance policy cards, scrolls to the interactive sandbox, drags the
Local Hour slider past 21:00 (Quiet Hours), then clicks 'Inject Event' in the
header. It selects the 'Late-Night Quiet Hours' preset, injects the case, and
shows the instant VETO verdict inside the drawer.

[VOICEOVER]:
"Now let's examine what makes Recovery truly enterprise-ready for regulated
financial institutions: our deterministic Compliance Hard Gates.

Most AI tools use unguided LLM prompts that hallucinate or ignore business rules.
Recovery implements seven strict, deterministic Python evaluation gates that run
BEFORE any customer contact is allowed:
1. TRAI National DND Registry check suppressing non-consented outreach.
2. Strict Quiet Hours between 9:00 PM and 9:00 AM in customer local time.
3. A 24-hour contact frequency cap of at most two touches per customer.
4. Card gateway retry limits capped at three exponential backoff attempts.
5. Immediate STOP opt-out honoring with permanent workflow termination.
6. Automatic escalation for high-value B2B disputes above ₹50,000.
7. An economic cost-aware stop halting workflows if fees exceed 15% of case value.

Below, in our Interactive Compliance Sandbox, compliance officers can simulate any
parameter in real time. Notice as we drag the local time slider past 9:00 PM, the
Quiet Hours gate immediately turns red and issues a VETO.

Let's test this live by clicking 'Inject Event' in the header. We'll pick the
'Late-Night Quiet Hours' preset and inject it straight into the engine.

As you can see in the drawer, the state machine halts immediately at the
Compliance gate. The action is vetoed, zero messages are dispatched, and the exact
regulatory reason is recorded to our audit ledger."
```

```
================================================================================
PART 4: CRYPTOGRAPHIC TAMPER-EVIDENT AUDIT CHAIN & EXPORT (2:40 – 3:40 | 60s)
================================================================================
[VISUAL CUE]: Cursor clicks 'Instant' to process all remaining batch records,
then clicks 'Audit Log' in the navbar. It filters the table by 'Blocked / Vetoed
Only', expands a structured JSON payload, clicks the 'Verify Hash Chain' button,
hovers over Genesis Hash and Chain Head, closes the modal, and hovers over 'Export CSV'.

[VOICEOVER]:
"In modern banking and enterprise SaaS, you cannot just claim compliance — you must
prove it mathematically.

Let's complete the remaining batch and navigate to our Audit Log.

Every single decision made by every agent node — including why an action was
approved, escalated, or vetoed — is appended to an immutable, append-only SQLite
ledger.

We can filter exclusively for Blocked events to inspect compliance vetoes, and
expand the structured JSON payload to review the exact evidentiary context.

More importantly, look at this button: 'Verify Hash Chain'. When we click it,
the backend traverses every single audit record from genesis hash — 64 zeros —
computing canonical JSON SHA-256 signatures in an unbroken cryptographic chain all
the way to the chain head.

As verified on screen: 1,755 audit entries verified, zero tampered records,
cryptographic verification passed. If even a single byte or timestamp were altered
directly in the database, the hash chain would immediately break and flag the exact
tampered record.

Auditors can also export the complete cryptographic log directly to CSV with a
single click."
```

```
================================================================================
PART 5: FINANCIAL FUNNEL & CHANNEL UNIT ECONOMICS (3:40 – 4:40 | 60s)
================================================================================
[VISUAL CUE]: Cursor clicks 'Reports' (Analytics) in the navbar. It pans across
the Financial Waterfall chart showing Gross at Risk down to Net Recovered Cash,
scrolls to the Channel Performance breakdown, and drags the Interactive Annual ROI
Simulator slider to demonstrate scaling savings.

[VOICEOVER]:
"Now let's review the financial economics of autonomous recovery on the Reports
dashboard.

Here on our Waterfall Chart, you see the exact financial bridge:
We started with ₹33.41 Lakhs in total revenue at risk across 300 customer cases.
Our automated pipeline recovered ₹17.25 Lakhs across WhatsApp, Voice, and Smart
Gateway Retries.

Notice our total operational communication expenditure: just ₹196.10. That results
in net recovered revenue of ₹17.25 Lakhs and an outstanding ROI multiplier of
8,799x.

Scrolling down, our Channel Performance breakdown compares conversion efficiency
and unit economics across WhatsApp, Voice synthesis, and payment retries.

Further below is our Interactive Annual ROI Simulator. For enterprise finance leaders
evaluating Recovery at scale, dragging this monthly transaction volume slider demonstrates
how our multi-agent pipeline can recover tens of lakhs in annual revenue while
maintaining full statutory compliance."
```

```
================================================================================
PART 6: CLOSING SUMMARY & REPRODUCIBILITY (4:40 – 5:00 | 20s)
================================================================================
[VISUAL CUE]: Cursor clicks back to 'Overview', opens the Date Range Picker for
a quick look at calendar presets, closes it, and rests smoothly on the central
metric: ₹17.25 Lakhs Recovered (51.6%).

[VOICEOVER]:
"To summarize: Recovery combines compiled LangGraph agent orchestration, deterministic
statutory compliance hard gates, localized multi-channel execution, and cryptographic
tamper-evident audit trails into a single, cohesive platform.

Every number demonstrated today is 100% mathematically reproducible with seed 42.

Thank you for watching the Recovery demonstration."
================================================================================
```

---

## 🛠️ Section 3: How to Re-Record the 5-Minute Video

The screen recording script is completely automated using Playwright and FFmpeg:

```bash
# Ensure both servers are running
# Backend: http://localhost:8000
# Frontend: http://localhost:3000

# Run automated screen recording
python record_5min_demo.py
```

This will:
1. Launch an automated headless Chromium browser with a 1080p viewport (`1920x1080`).
2. Inject a smooth visual cursor overlay (blue tracking ring with red click feedback).
3. Execute all 6 script parts across exactly **300.0 seconds**.
4. Convert the raw WebM recording into a pristine, high-definition MP4 file at [`recovery_5min_pitch_demo.mp4`](./recovery_5min_pitch_demo.mp4).
