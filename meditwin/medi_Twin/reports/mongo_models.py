"""
MongoDB helpers for health reports.
Reports store both patient_id and doctor_id as foreign keys.
"""
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from medi_Twin.mongo import get_collection


def reports_collection():
    return get_collection('reports')


def save_report(patient_id, filename, report_type='full', doctor_id=None, notes=''):
    """Save report metadata after PDF generation."""
    doc = {
        'patient_id': patient_id,
        'doctor_id': doctor_id,
        'filename': filename,
        'report_type': report_type,
        'notes': notes,
        'generated_at': datetime.now(timezone.utc),
    }
    result = reports_collection().insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    return doc


def get_reports_by_patient(patient_id, limit=10):
    """List reports for a patient."""
    cursor = reports_collection().find(
        {'patient_id': patient_id}
    ).sort('generated_at', -1).limit(limit)
    records = []
    for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(doc)
    return records


def get_reports_by_doctor(doctor_id, limit=20):
    """List reports reviewed/assigned to a doctor."""
    cursor = reports_collection().find(
        {'doctor_id': doctor_id}
    ).sort('generated_at', -1).limit(limit)
    records = []
    for doc in cursor:
        doc['_id'] = str(doc['_id'])
        records.append(doc)
    return records
