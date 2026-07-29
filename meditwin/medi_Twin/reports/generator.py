"""
PDF report generator using ReportLab.
Produces a clinical-style health summary PDF for a patient.
"""
import os
from datetime import datetime, timezone
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


MEDI_GREEN = colors.HexColor('#1DB954')
DARK_NAVY = colors.HexColor('#1E3A5F')
LIGHT_BG = colors.HexColor('#F5F9FC')
GREY_TEXT = colors.HexColor('#4A5568')
LIGHT_GREY = colors.HexColor('#E2E8F0')


def header_footer(canvas_obj, doc):
    """Draw header and footer on each page."""
    canvas_obj.saveState()
    w, h = A4
    # Header line
    canvas_obj.setStrokeColor(MEDI_GREEN)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(2*cm, h - 1.5*cm, w - 2*cm, h - 1.5*cm)
    # Footer line
    canvas_obj.line(2*cm, 1.5*cm, w - 2*cm, 1.5*cm)
    # Footer text
    canvas_obj.setFont('Helvetica', 7)
    canvas_obj.setFillColor(GREY_TEXT)
    canvas_obj.drawCentredString(w / 2, 1*cm, f"MediTwin Health Report — Page {doc.page}")
    canvas_obj.drawRightString(w - 2*cm, 1*cm, datetime.now(timezone.utc).strftime('%Y-%m-%d'))
    # Disclaimer
    canvas_obj.setFont('Helvetica', 5.5)
    canvas_obj.drawCentredString(w / 2, 0.6*cm, "This report is generated for informational purposes only. Consult your physician for medical advice.")
    canvas_obj.restoreState()


def generate_health_report(patient_user, profile, vitals_list, risk_scores, doctor_user=None, report_date=None):
    """
    Generate a PDF health report.

    Args:
        patient_user: Django User instance
        profile: dict from MongoDB health_profiles
        vitals_list: list of recent vitals dicts
        risk_scores: dict with 'conditions' and 'cascade_effects'
        doctor_user: Django User instance or None
        report_date: datetime for report date (defaults to now)

    Returns:
        str: filename of the generated PDF
    """
    reports_dir = settings.REPORTS_DIR
    os.makedirs(reports_dir, exist_ok=True)

    today = report_date or datetime.now(timezone.utc)
    date_str = today.strftime('%Y%m%d')
    display_date = today.strftime('%B %d, %Y at %H:%M UTC')

    patient_name = f"{patient_user.first_name} {patient_user.last_name}"
    safe_name = patient_name.replace(' ', '_').lower()
    filename = f"{safe_name}_{date_str}_meditwin.pdf"
    filepath = os.path.join(reports_dir, filename)

    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2.5*cm, bottomMargin=2.5*cm,
    )

    styles = getSampleStyleSheet()

    # ── Custom Styles ────────────────────────────────────────────
    title_style = ParagraphStyle(
        'Title2', parent=styles['Title'],
        fontSize=16, spaceAfter=4,
        textColor=DARK_NAVY, alignment=TA_CENTER,
        fontName='Helvetica-Bold', leading=20,
    )
    info_style = ParagraphStyle(
        'Info', parent=styles['Normal'],
        fontSize=9, textColor=GREY_TEXT,
        alignment=TA_CENTER, spaceAfter=2,
        fontName='Helvetica', leading=12,
    )
    section_style = ParagraphStyle(
        'Section', parent=styles['Heading2'],
        fontSize=12, spaceBefore=10, spaceAfter=6,
        textColor=DARK_NAVY, fontName='Helvetica-Bold',
        leading=15,
    )

    elements = []

    # ══════════════════════════════════════════════════════════════
    # REPORT TITLE & INFO
    # ══════════════════════════════════════════════════════════════
    elements.append(Paragraph("MediTwin Health Report", title_style))
    elements.append(Spacer(1, 0.2*cm))

    # Patient info block
    info_data = [
        [Paragraph(f"<b>Patient Name</b>", info_style),
         Paragraph(f"{patient_name}", info_style)],
        [Paragraph(f"<b>Date</b>", info_style),
         Paragraph(f"{display_date}", info_style)],
    ]
    if doctor_user:
        doctor_name = f"Dr. {doctor_user.first_name} {doctor_user.last_name}"
        info_data.append([
            Paragraph(f"<b>Attending Physician</b>", info_style),
            Paragraph(f"{doctor_name}", info_style),
        ])
    info_data.append([
        Paragraph(f"<b>Report ID</b>", info_style),
        Paragraph(f"MT-{today.strftime('%Y%m%d-%H%M%S')}", info_style),
    ])

    info_table = Table(info_data, colWidths=[4.5*cm, 11.5*cm])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LINEBELOW', (0, 0), (-1, 0), 0.3, MEDI_GREEN),
        ('LINEBELOW', (0, 1), (-1, 1), 0.3, LIGHT_GREY),
        ('LINEBELOW', (0, 2), (-1, 2), 0.3, LIGHT_GREY),
        ('LINEBELOW', (0, 3), (-1, 3), 0.3, LIGHT_GREY),
        ('BACKGROUND', (0, 0), (0, -1), LIGHT_BG),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.5*cm))

    # ══════════════════════════════════════════════════════════════
    # 1. DEMOGRAPHICS
    # ══════════════════════════════════════════════════════════════
    if profile:
        demo = profile.get('demographics', {})
        lifestyle = profile.get('lifestyle', {})
        elements.append(Paragraph("1. Patient Demographics", section_style))

        demo_data = [
            ['Age', str(demo.get('age', '-'))],
            ['Gender', patient_user.gender.title() if hasattr(patient_user, 'gender') and patient_user.gender else 'Not specified'],
            ['Height', f"{demo.get('height_cm', '-')} cm"],
            ['Weight', f"{demo.get('weight_kg', '-')} kg"],
            ['BMI', f"{demo.get('bmi', '-')}"],
            ['Blood Type', demo.get('blood_type', '-') or '-'],
            ['Smoking', 'Yes' if lifestyle.get('smoking') else 'No'],
            ['Alcohol', lifestyle.get('alcohol', 'Not specified').title()],
        ]
        if profile.get('medical_conditions'):
            demo_data.append(['Medical Conditions', ', '.join(profile['medical_conditions']) or 'None'])
        if profile.get('medications'):
            demo_data.append(['Current Medications', ', '.join(profile['medications']) or 'None'])
        if profile.get('allergies'):
            demo_data.append(['Allergies', ', '.join(profile['allergies']) or 'None'])
        if profile.get('family_history'):
            demo_data.append(['Family History', ', '.join(profile['family_history'])])

        t = Table(demo_data, colWidths=[4.5*cm, 11.5*cm])
        t.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.3, LIGHT_GREY),
            ('BACKGROUND', (0, 0), (0, -1), LIGHT_BG),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 0), (0, -1), DARK_NAVY),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.4*cm))

    # ══════════════════════════════════════════════════════════════
    # 2. RISK ASSESSMENT
    # ══════════════════════════════════════════════════════════════
    conditions = risk_scores.get('conditions', {}) if risk_scores else {}
    if conditions:
        elements.append(Paragraph("2. Risk Assessment", section_style))
        risk_data = [['Condition', 'Probability', 'Risk Level']]
        for cond, info in conditions.items():
            prob = info['probability']
            level = info['risk_level']
            color_hex = '#E53E3E' if level == 'critical' else '#DD6B20' if level == 'high' else '#D69E2E' if level == 'moderate' else '#38A169'
            risk_data.append([
                cond.replace('_', ' ').title(),
                f"{prob*100:.1f}%",
                f"{level.upper()}",
            ])

        t = Table(risk_data, colWidths=[6*cm, 5*cm, 5*cm])
        t.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.3, LIGHT_GREY),
            ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        # Color-code risk levels
        for i, (_, _, level) in enumerate(risk_data[1:], start=1):
            lvl = level.strip().lower()
            if lvl == 'critical':
                t.setStyle(TableStyle([('TEXTCOLOR', (2, i), (2, i), colors.HexColor('#E53E3E'))]))
            elif lvl == 'high':
                t.setStyle(TableStyle([('TEXTCOLOR', (2, i), (2, i), colors.HexColor('#DD6B20'))]))
            elif lvl == 'moderate':
                t.setStyle(TableStyle([('TEXTCOLOR', (2, i), (2, i), colors.HexColor('#D69E2E'))]))
            else:
                t.setStyle(TableStyle([('TEXTCOLOR', (2, i), (2, i), colors.HexColor('#38A169'))]))

        elements.append(t)
        elements.append(Spacer(1, 0.4*cm))

    # ══════════════════════════════════════════════════════════════
    # 3. RECENT VITALS
    # ══════════════════════════════════════════════════════════════
    if vitals_list:
        elements.append(Paragraph("3. Recent Vitals", section_style))
        vitals_header = ['Date', 'HR (bpm)', 'BP (mmHg)', 'SpO2 (%)', 'Glucose (mg/dL)', 'Temp (°C)']
        vitals_rows = [vitals_header]
        for v in vitals_list[:10]:
            recorded = v.get('recorded_at', '')
            if isinstance(recorded, datetime):
                recorded = recorded.strftime('%Y-%m-%d %H:%M')
            bp = f"{v.get('systolic_bp', '-')}/{v.get('diastolic_bp', '-')}"
            vitals_rows.append([
                str(recorded)[:16],
                str(v.get('heart_rate', '-')),
                bp,
                str(v.get('spo2', '-')),
                str(v.get('blood_glucose', '-')),
                str(v.get('temperature', '-')),
            ])

        t = Table(vitals_rows, colWidths=[3*cm, 2.2*cm, 2.5*cm, 2.2*cm, 3*cm, 2.5*cm])
        t.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.3, LIGHT_GREY),
            ('BACKGROUND', (0, 0), (-1, 0), DARK_NAVY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.3*cm))

        # Vitals reference ranges note
        ref_text = (
            "<i>Reference ranges: HR 60-100 bpm | BP &lt;120/80 mmHg | "
            "SpO2 ≥95% | Glucose 70-140 mg/dL | Temp 36.5-37.5°C</i>"
        )
        elements.append(Paragraph(ref_text, ParagraphStyle(
            'Ref', parent=styles['Normal'],
            fontSize=7, textColor=GREY_TEXT, alignment=TA_CENTER,
            spaceBefore=2, spaceAfter=6,
        )))

    # ── Build PDF with header/footer ─────────────────────────────
    doc.build(elements, onFirstPage=header_footer, onLaterPages=header_footer)
    return filename
