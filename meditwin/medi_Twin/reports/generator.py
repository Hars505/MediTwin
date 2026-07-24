"""
PDF report generator using ReportLab.
Produces a clinical-style health summary PDF for a patient.
"""
import os
from io import BytesIO
from datetime import datetime, timezone

from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_health_report(user, profile, vitals_list, risk_scores):
    """
    Generate a PDF health report and return the filename.

    Args:
        user:         Django User instance
        profile:      dict from MongoDB health_profiles
        vitals_list:  list of recent vitals dicts
        risk_scores:  dict with 'conditions' and 'cascade_effects'

    Returns:
        str: filename of the generated PDF (relative to MEDIA_ROOT/reports/)
    """
    # Ensure reports directory exists
    reports_dir = settings.REPORTS_DIR
    os.makedirs(reports_dir, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    filename = f"meditwin_report_{user.id}_{timestamp}.pdf"
    filepath = os.path.join(reports_dir, filename)

    doc = SimpleDocTemplate(filepath, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title2', parent=styles['Title'], fontSize=18,
                                  spaceAfter=12, textColor=colors.HexColor('#1a237e'))
    heading_style = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=13,
                                    spaceAfter=6, textColor=colors.HexColor('#283593'))

    elements = []

    # ── Title ────────────────────────────────────────────────────
    elements.append(Paragraph("MediTwin Health Report", title_style))
    elements.append(Paragraph(
        f"Patient: {user.first_name} {user.last_name} ({user.username})",
        styles['Normal'],
    ))
    elements.append(Paragraph(
        f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        styles['Normal'],
    ))
    elements.append(Spacer(1, 0.5*cm))

    # ── Demographics ─────────────────────────────────────────────
    if profile:
        demo = profile.get('demographics', {})
        elements.append(Paragraph("Demographics", heading_style))
        demo_data = [
            ['Age', str(demo.get('age', '-'))],
            ['Height (cm)', str(demo.get('height_cm', '-'))],
            ['Weight (kg)', str(demo.get('weight_kg', '-'))],
            ['BMI', str(demo.get('bmi', '-'))],
            ['Blood Type', demo.get('blood_type', '-') or '-'],
        ]
        t = Table(demo_data, colWidths=[5*cm, 10*cm])
        t.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8eaf6')),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.4*cm))

    # ── Risk Scores ──────────────────────────────────────────────
    conditions = risk_scores.get('conditions', {}) if risk_scores else {}
    if conditions:
        elements.append(Paragraph("Risk Assessment", heading_style))
        risk_data = [['Condition', 'Probability', 'Level']]
        for cond, info in conditions.items():
            risk_data.append([
                cond.replace('_', ' ').title(),
                f"{info['probability']*100:.1f}%",
                info['risk_level'].upper(),
            ])
        t = Table(risk_data, colWidths=[6*cm, 4.5*cm, 4.5*cm])
        t.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#283593')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.4*cm))

    # ── Recent Vitals ────────────────────────────────────────────
    if vitals_list:
        elements.append(Paragraph("Recent Vitals", heading_style))
        vitals_header = ['Date', 'HR', 'BP', 'SpO2', 'Glucose', 'Temp']
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
        t = Table(vitals_rows, colWidths=[3.5*cm, 2*cm, 3*cm, 2*cm, 2.5*cm, 2*cm])
        t.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#283593')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(t)

    # ── Build PDF ────────────────────────────────────────────────
    doc.build(elements)
    return filename
