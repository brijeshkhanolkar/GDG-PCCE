import sys
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_demo_script_document():
    doc = docx.Document()

    # Set standard margins (0.75 in for elegant layout)
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # Palette
    COLOR_GOLD = RGBColor(180, 140, 50)       # #B48C32 (refined gold)
    COLOR_DARK = RGBColor(18, 18, 20)          # #121214 (rich black)
    COLOR_MUTED = RGBColor(105, 105, 110)      # #69696E
    COLOR_RED = RGBColor(150, 45, 38)          # #962D26 (stamp red)
    COLOR_NAVY = RGBColor(30, 50, 80)
    COLOR_WHITE = RGBColor(255, 255, 255)

    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    # ─── HEADER BANNER TABLE ──────────────────────────────────────────────────
    header_table = doc.add_table(rows=1, cols=1)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = header_table.cell(0, 0)
    set_cell_background(cell, "121214")
    set_cell_margins(cell, top=240, bottom=240, left=240, right=240)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    r_tag = p.add_run("COURTFLIGHT // LIVE PRESENTATION MANUAL")
    r_tag.font.name = "Arial"
    r_tag.font.size = Pt(9)
    r_tag.font.bold = True
    r_tag.font.color.rgb = COLOR_GOLD

    p_title = cell.add_paragraph()
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("3-Minute High-Impact Pitch & Live Demo Script")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_WHITE

    p_sub = cell.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(4)
    r_sub = p_sub.add_run("Step-by-step cue sheet: Exact screen actions [SHOW], word-for-word spoken transcript [TELL], stage timings, and winning Q&A responses.")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(10.5)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(210, 210, 215)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # ─── SECTION: PRE-DEMO SETUP & CHECKLIST ──────────────────────────────────
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(4)
    r_h1 = h1.add_run("1. Pre-Demo Setup & Presenter Checklist")
    r_h1.font.name = "Arial"
    r_h1.font.size = Pt(14)
    r_h1.font.bold = True
    r_h1.font.color.rgb = COLOR_DARK

    checklist_items = [
        ("Environment Check", "Ensure dev server is running (e.g. http://localhost:3002 or deployed Vercel domain)."),
        ("Browser Tab 1", "Open Home Page ( / ) — ensure hero background video loops smoothly and departure rows are loaded."),
        ("Browser Tab 2", "Open Dispatch Terminal ( /analyze ) — pre-select 'Commercial Dispute @ Delhi HC' or leave default."),
        ("Display Resolution", "Zoom browser to 100% or 110% for crisp visibility on projection displays."),
        ("Backup Plan", "Keep sample docket ID 'NYR-00001' on your clipboard (Ctrl+C).")
    ]

    t_check = doc.add_table(rows=len(checklist_items) + 1, cols=2)
    t_check.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_check.autofit = False

    # Header
    set_cell_background(t_check.cell(0, 0), "EAEAEF")
    set_cell_background(t_check.cell(0, 1), "EAEAEF")
    set_cell_margins(t_check.cell(0, 0), 100, 100, 140, 140)
    set_cell_margins(t_check.cell(0, 1), 100, 100, 140, 140)
    r = t_check.cell(0, 0).paragraphs[0].add_run("ITEM / TARGET")
    r.font.bold = True
    r.font.size = Pt(9.5)
    r = t_check.cell(0, 1).paragraphs[0].add_run("INSTRUCTION / ACTION")
    r.font.bold = True
    r.font.size = Pt(9.5)

    for idx, (target, instr) in enumerate(checklist_items):
        c0 = t_check.cell(idx + 1, 0)
        c1 = t_check.cell(idx + 1, 1)
        set_cell_margins(c0, 80, 80, 140, 140)
        set_cell_margins(c1, 80, 80, 140, 140)
        if idx % 2 == 1:
            set_cell_background(c0, "F8F8F9")
            set_cell_background(c1, "F8F8F9")
        r0 = c0.paragraphs[0].add_run(target)
        r0.font.bold = True
        r0.font.size = Pt(9)
        r1 = c1.paragraphs[0].add_run(instr)
        r1.font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # ─── SECTION: TIMING OVERVIEW ─────────────────────────────────────────────
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(12)
    h2.paragraph_format.space_after = Pt(4)
    r_h2 = h2.add_run("2. Timing & Act Breakdown (180 Seconds Total)")
    r_h2.font.name = "Arial"
    r_h2.font.size = Pt(14)
    r_h2.font.bold = True
    r_h2.font.color.rgb = COLOR_DARK

    acts = [
        ("0:00 - 0:30 (30s)", "Act 1: The Problem & Flight Metaphor", "The 50M pendency crisis, introducing the flight tracking paradigm."),
        ("0:30 - 1:15 (45s)", "Act 2: Departure Board & Boarding Pass", "Docket search, Litigation Manifest, boarding pass card with gold foil."),
        ("1:15 - 2:00 (45s)", "Act 3: Airplane Timeline & Explainable AI", "Cruising airplane glyph, procedural turbulence, 'Why this estimate?'."),
        ("2:00 - 2:45 (45s)", "Act 4: Live Case Dispatch (Interactive k-NN)", "Interactive form at /analyze, real-time POST /api/predict execution."),
        ("2:45 - 3:00 (15s)", "Act 5: Technical Stack & Closing Pitch", "Next.js 14, 1,565 cases, plug-and-play eCourts integration.")
    ]

    t_acts = doc.add_table(rows=len(acts) + 1, cols=3)
    t_acts.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_cell_background(t_acts.cell(0, 0), "121214")
    set_cell_background(t_acts.cell(0, 1), "121214")
    set_cell_background(t_acts.cell(0, 2), "121214")
    for col_idx, col_name in enumerate(["TIME CUE", "ACT TITLE", "KEY FOCUS"]):
        c = t_acts.cell(0, col_idx)
        set_cell_margins(c, 100, 100, 140, 140)
        r = c.paragraphs[0].add_run(col_name)
        r.font.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = COLOR_WHITE

    for idx, (time_cue, title, focus) in enumerate(acts):
        c0 = t_acts.cell(idx + 1, 0)
        c1 = t_acts.cell(idx + 1, 1)
        c2 = t_acts.cell(idx + 1, 2)
        set_cell_margins(c0, 80, 80, 140, 140)
        set_cell_margins(c1, 80, 80, 140, 140)
        set_cell_margins(c2, 80, 80, 140, 140)
        if idx % 2 == 1:
            set_cell_background(c0, "F8F8F9")
            set_cell_background(c1, "F8F8F9")
            set_cell_background(c2, "F8F8F9")
        r0 = c0.paragraphs[0].add_run(time_cue)
        r0.font.bold = True
        r0.font.size = Pt(8.5)
        r0.font.color.rgb = COLOR_GOLD
        r1 = c1.paragraphs[0].add_run(title)
        r1.font.bold = True
        r1.font.size = Pt(9)
        r2 = c2.paragraphs[0].add_run(focus)
        r2.font.size = Pt(8.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(16)

    # ─── DETAILED ACTS FUNCTION ───────────────────────────────────────────────
    def add_act_section(act_num, time_range, title, show_text, tell_text, key_takeaway):
        doc.add_page_break() if act_num == 3 else None
        
        # Section Header
        p_act = doc.add_paragraph()
        p_act.paragraph_format.space_before = Pt(14)
        p_act.paragraph_format.space_after = Pt(2)
        r_act_badge = p_act.add_run(f"ACT {act_num} // {time_range}")
        r_act_badge.font.name = "Arial"
        r_act_badge.font.size = Pt(9.5)
        r_act_badge.font.bold = True
        r_act_badge.font.color.rgb = COLOR_GOLD

        p_act_title = doc.add_paragraph()
        p_act_title.paragraph_format.space_after = Pt(8)
        r_act_title = p_act_title.add_run(title)
        r_act_title.font.name = "Arial"
        r_act_title.font.size = Pt(15)
        r_act_title.font.bold = True
        r_act_title.font.color.rgb = COLOR_DARK

        # SHOW Box (Gray Callout)
        t_show = doc.add_table(rows=1, cols=1)
        t_show.alignment = WD_TABLE_ALIGNMENT.CENTER
        c_show = t_show.cell(0, 0)
        set_cell_background(c_show, "F3F3F5")
        set_cell_margins(c_show, 120, 120, 160, 160)
        p_show_lbl = c_show.paragraphs[0]
        p_show_lbl.paragraph_format.space_after = Pt(2)
        r_s_lbl = p_show_lbl.add_run("🖥️ [SHOW] ON SCREEN ACTION:")
        r_s_lbl.font.bold = True
        r_s_lbl.font.size = Pt(9.5)
        r_s_lbl.font.color.rgb = COLOR_NAVY
        p_show_txt = c_show.add_paragraph()
        p_show_txt.paragraph_format.space_after = Pt(0)
        r_s_txt = p_show_txt.add_run(show_text)
        r_s_txt.font.size = Pt(9.5)

        doc.add_paragraph().paragraph_format.space_after = Pt(6)

        # TELL Box (Rich Dark/Gold Callout)
        t_tell = doc.add_table(rows=1, cols=1)
        t_tell.alignment = WD_TABLE_ALIGNMENT.CENTER
        c_tell = t_tell.cell(0, 0)
        set_cell_background(c_tell, "121214")
        set_cell_margins(c_tell, 140, 140, 180, 180)
        p_tell_lbl = c_tell.paragraphs[0]
        p_tell_lbl.paragraph_format.space_after = Pt(3)
        r_t_lbl = p_tell_lbl.add_run("🎙️ [TELL] VERBATIM SPOKEN SCRIPT:")
        r_t_lbl.font.bold = True
        r_t_lbl.font.size = Pt(9.5)
        r_t_lbl.font.color.rgb = COLOR_GOLD
        p_tell_txt = c_tell.add_paragraph()
        p_tell_txt.paragraph_format.space_after = Pt(0)
        r_t_txt = p_tell_txt.add_run(f'"{tell_text}"')
        r_t_txt.font.size = Pt(10)
        r_t_txt.font.italic = True
        r_t_txt.font.color.rgb = RGBColor(245, 243, 238)

        doc.add_paragraph().paragraph_format.space_after = Pt(4)

        # Presenter Tip
        p_tip = doc.add_paragraph()
        p_tip.paragraph_format.space_before = Pt(2)
        p_tip.paragraph_format.space_after = Pt(10)
        r_tip_tag = p_tip.add_run("💡 Presenter Tip: ")
        r_tip_tag.font.bold = True
        r_tip_tag.font.size = Pt(9)
        r_tip_tag.font.color.rgb = COLOR_MUTED
        r_tip_txt = p_tip.add_run(key_takeaway)
        r_tip_txt.font.size = Pt(9)
        r_tip_txt.font.color.rgb = COLOR_MUTED

    # ─── ACT 1 ────────────────────────────────────────────────────────────────
    add_act_section(
        act_num=1,
        time_range="0:00 - 0:30 (30 seconds)",
        title="The Hook & The Flight Radar Metaphor",
        show_text="Open Browser Tab 1 at http://localhost:3002. Let the cinematic ambient hero video loop in the background. Hover briefly over the large headline 'Track your case. Like a flight.' and point out the Radar Telemetry side panel showing 'Feed Active' and live docket counts.",
        tell_text="In India today, over 50 million cases are pending in our judicial system. For citizens and businesses, filing a lawsuit feels like launching a ship into a black hole with zero visibility on when or where it will ever land.\n\nThis is CourtFlight. We asked a fundamental question: What if you could track your court case with the exact same precision, transparency, and clarity as an airline flight?\n\nUsing our Sovereign Juris editorial design system and an empirical multi-dimensional k-NN prediction engine, CourtFlight transforms opaque court records into real-time orbital flight telemetry.",
        key_takeaway="Start with energy and conviction. The contrast between '50M pending cases' and 'tracking like a flight' instantly hooks judges."
    )

    # ─── ACT 2 ────────────────────────────────────────────────────────────────
    add_act_section(
        act_num=2,
        time_range="0:30 - 1:15 (45 seconds)",
        title="The Departure Board & The Digital Boarding Pass",
        show_text="Scroll down smoothly to the 'Primary Carrier Docket' (the Departure Board). Point out the rows styled like an airport departures board (ID, Court, Category, Progress Bar, ETA, Status Seal). Click on case 'NYR-00001'. On the case details page, pause on the dark luxury Boarding Pass card with its 2px gold foil left edge, barcode visual, airport codes (TEL -> SCI), and party names.",
        tell_text="Here is our primary departure board. Notice how each case is codified with flight progress and status seals. Let’s track docket NYR-00001.\n\nInstantly, the system generates an official Litigation Manifest—a digital boarding pass. Notice the flight route codes: TEL to SCI—Telangana High Court to the Supreme Court of India.\n\nEvery party, procedural milestone, and complexity grade is verified. Litigants can even download this boarding pass directly to their device as a signed procedural document. But now, let’s inspect the active flight path.",
        key_takeaway="Let the audience appreciate the visual aesthetic of the Boarding Pass. Emphasize that this replaces confusing legal summonses with an intuitive document."
    )

    # ─── ACT 3 ────────────────────────────────────────────────────────────────
    add_act_section(
        act_num=3,
        time_range="1:15 - 2:00 (45 seconds)",
        title="The Airplane Timeline, Turbulence & Explainable AI",
        show_text="Scroll down to the Tracker Hero section with the ambient video overlay. Highlight the animated Airplane Glyph cruising at 'Stage 05: Arguments' with its pulsing radar blip. Point to the 'Moderate Turbulence' badge (52/100). Then scroll down to the 'Why This Estimate?' factor breakdown, pointing out the Adjournment Drag (+6 mo delay) and the Precedent Vectors table featuring the ★ Public Benchmark badge.",
        tell_text="Here is the live flight tracker. The case is currently cruising at Stage 5: Arguments. Notice the pulsating airplane icon on the timeline—it isn't just decorative; it tracks live altitude, months elapsed, and stage holding patterns.\n\nRight here, our engine detects Moderate Turbulence. Why? Because this case has recorded 6 adjournments—2.2 more than the regional cohort benchmark. Our model translates that directly into a +6 month timeline drag penalty.\n\nUnlike black-box AI, CourtFlight provides total algorithmic explainability. In our 'Why this estimate?' breakdown, litigants see exact causal factors: baseline court speed, postponement drag, and complexity grades.\n\nAnd below, we display the top 5 nearest precedent cases from our archive, including real Supreme Court landmark cases with official legal citations.",
        key_takeaway="Judges love Explainable AI. Highlighting the mathematical connection between 'adjournments' and 'months of delay' proves this is real data science."
    )

    # ─── ACT 4 ────────────────────────────────────────────────────────────────
    add_act_section(
        act_num=4,
        time_range="2:00 - 2:45 (45 seconds)",
        title="Live Case Dispatch — The Interactive 'Wow' Moment",
        show_text="Switch to Tab 2: http://localhost:3002/analyze. Show the Flight Dispatch Console. Click the preset chip 'Commercial Dispute @ Delhi HC'. Drag the adjournments slider back and forth to show the live turbulence preview changing from 'Smooth Flight' to 'Severe Turbulence'. Click the gold 'Launch Telemetry & Compute KNN' button. Show the instant result generation: custom Boarding Pass, custom flight path, and tailored ETA.",
        tell_text="Now, what if you have a brand new case filed just this morning?\n\nHere in our Case Dispatch Terminal, any lawyer or corporate counsel can input custom docket vectors. Watch what happens as I adjust the adjournments slider: our system computes procedural turbulence in real time.\n\nLet’s select a high-stakes Commercial Dispute at the Delhi High Court and click 'Launch Telemetry'.\n\n[Click button — wait 1 second]\n\nIn milliseconds, our POST /api/predict endpoint builds a 33-dimensional feature vector, queries our archive of 1,565 dockets, calculates Euclidean nearest neighbors, and generates a bespoke flight trajectory—complete with a synthesized boarding pass, calibrated confidence score, and explainable timeline.",
        key_takeaway="This is the climax of your presentation. Doing a live interactive calculation proves that the API and algorithm are fully operational, not pre-rendered videos."
    )

    # ─── ACT 5 ────────────────────────────────────────────────────────────────
    add_act_section(
        act_num=5,
        time_range="2:45 - 3:00 (15 seconds)",
        title="Architecture, Scalability & Closing Pitch",
        show_text="Scroll back to the top or glance at the navigation links (Dockets, Trajectory, Manifest). End on the strong hero headline. Stand tall, look at the judges, and deliver the closing line.",
        tell_text="Under the hood, CourtFlight is powered by Next.js 14 App Router, Tailwind CSS, and a zero-dependency k-NN machine learning engine. It is completely production-ready and built to plug directly into live eCourts and National Judicial Data Grid APIs.\n\nCourtFlight turns legal anxiety into procedural clarity.\n\nThank you.",
        key_takeaway="End crisply right at the 2:55 - 3:00 mark. Leaving 5 seconds of silence before the buzzer makes you look exceptionally polished."
    )

    # ─── SECTION: ANTICIPATED Q&A ─────────────────────────────────────────────
    doc.add_page_break()
    h_qa = doc.add_paragraph()
    h_qa.paragraph_format.space_before = Pt(14)
    h_qa.paragraph_format.space_after = Pt(4)
    r_qa = h_qa.add_run("3. Anticipated Q&A (Judge Defense Guide)")
    r_qa.font.name = "Arial"
    r_qa.font.size = Pt(14)
    r_qa.font.bold = True
    r_qa.font.color.rgb = COLOR_DARK

    qa_list = [
        (
            "Is this real machine learning or just hardcoded values?",
            "It is a genuine multi-dimensional k-Nearest Neighbors (k-NN) algorithm. We normalize case age, adjournment frequency, stage progress, court jurisdiction, and complexity into a 33-dimensional vector. The engine computes weighted Euclidean distances against 1,565 historical dockets, identifies the top k=15 nearest precedents, and computes empirical 25th, 50th, and 75th percentiles."
        ),
        (
            "Where does your data come from? Is it accurate?",
            "The system is powered by 1,550 case records statistically synthesized to match the exact pendency distributions, adjournment frequencies, and disposal rates reported in National Judicial Data Grid (NJDG) publications. To validate the engine, we also integrated 15 real public Supreme Court and High Court landmark cases (such as Shayara Bano and Navtej Johar) with official legal citations."
        ),
        (
            "How does your delay/turbulence scoring actually work?",
            "We analyze the case's adjournment count relative to its court and case-type benchmark. In our dataset, each adjournment correlates with approximately 2.8 months of additional procedural lag. Cases with postponement rates 1.5x above the cohort benchmark are flagged as Severe Turbulence (+75 score) and penalized accordingly in their ETA."
        ),
        (
            "How hard is it to integrate live eCourts data?",
            "Our API layer (POST and GET /api/predict) is completely decoupled from the data storage. When eCourts or state judicial APIs grant production access, our ingest pipeline can swap the underlying JSON data store with live database feeds without altering a single component of the UI or prediction logic."
        ),
        (
            "Who is the target user and what is the monetization model?",
            "CourtFlight serves two markets: B2C (individual litigants seeking peace of mind through affordable case-tracking subscriptions) and B2B (enterprise legal departments, banks, and law firms that manage hundreds of commercial disputes and need predictive forecasting for litigation reserves and trial strategy)."
        )
    ]

    t_qa = doc.add_table(rows=len(qa_list) + 1, cols=2)
    t_qa.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_cell_background(t_qa.cell(0, 0), "121214")
    set_cell_background(t_qa.cell(0, 1), "121214")
    set_cell_margins(t_qa.cell(0, 0), 100, 100, 140, 140)
    set_cell_margins(t_qa.cell(0, 1), 100, 100, 140, 140)
    r = t_qa.cell(0, 0).paragraphs[0].add_run("ANTICIPATED QUESTION")
    r.font.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = COLOR_WHITE
    r = t_qa.cell(0, 1).paragraphs[0].add_run("WINNING STRATEGIC ANSWER")
    r.font.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = COLOR_WHITE

    for idx, (q, a) in enumerate(qa_list):
        c0 = t_qa.cell(idx + 1, 0)
        c1 = t_qa.cell(idx + 1, 1)
        set_cell_margins(c0, 90, 90, 140, 140)
        set_cell_margins(c1, 90, 90, 140, 140)
        if idx % 2 == 1:
            set_cell_background(c0, "F8F8F9")
            set_cell_background(c1, "F8F8F9")
        rq = c0.paragraphs[0].add_run(q)
        rq.font.bold = True
        rq.font.size = Pt(9)
        rq.font.color.rgb = COLOR_DARK
        ra = c1.paragraphs[0].add_run(a)
        ra.font.size = Pt(8.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # Save to file
    out_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'CourtFlight_3Min_Demo_Script.docx'))
    doc.save(out_path)
    print(f"Document successfully created at: {out_path}")
    return out_path

if __name__ == '__main__':
    create_demo_script_document()
