"""
Clinical Decision Support (CDS) Rules Engine
Evaluates patient data against standard clinical guidelines (e.g., AHA/ACC, ADA) 
to generate actionable alerts and recommendations for doctors.
"""

def evaluate_patient_data(profile, vitals, risks):
    """
    Evaluates patient data and returns a list of actionable CDS alerts.
    
    Alert format:
    {
        "category": str,
        "severity": "info" | "warning" | "critical",
        "message": str,
        "recommendation": str,
        "reference": str,
    }
    """
    alerts = []

    # 1. Evaluate Vitals
    if vitals:
        # Blood Pressure (AHA Guidelines)
        sys = vitals.get('systolic_bp')
        dia = vitals.get('diastolic_bp')
        if sys and dia:
            if sys >= 180 or dia >= 120:
                alerts.append({
                    "category": "Hypertension",
                    "severity": "critical",
                    "message": f"Hypertensive Crisis (BP: {sys}/{dia} mmHg).",
                    "recommendation": "Immediate medical intervention required. Consider IV antihypertensives.",
                    "reference": "AHA/ACC 2017 Guidelines for High Blood Pressure",
                })
            elif sys >= 140 or dia >= 90:
                alerts.append({
                    "category": "Hypertension",
                    "severity": "warning",
                    "message": f"Stage 2 Hypertension (BP: {sys}/{dia} mmHg).",
                    "recommendation": "Evaluate for BP-lowering medication (e.g., ACE inhibitors, ARBs) and lifestyle modifications.",
                    "reference": "AHA/ACC 2017 Guidelines for High Blood Pressure",
                })
            elif sys >= 130 or dia >= 80:
                alerts.append({
                    "category": "Hypertension",
                    "severity": "info",
                    "message": f"Stage 1 Hypertension (BP: {sys}/{dia} mmHg).",
                    "recommendation": "Recommend lifestyle changes. Consider clinical ASCVD risk assessment.",
                    "reference": "AHA/ACC 2017 Guidelines for High Blood Pressure",
                })

        # Blood Glucose (ADA Guidelines)
        bg = vitals.get('blood_glucose')
        if bg:
            if bg > 250:
                alerts.append({
                    "category": "Hyperglycemia",
                    "severity": "critical",
                    "message": f"Severe Hyperglycemia (Glucose: {bg} mg/dL).",
                    "recommendation": "Check for ketones, assess for DKA/HHS. Adjust insulin regimen.",
                    "reference": "ADA Standards of Medical Care in Diabetes",
                })
            elif bg > 180:
                alerts.append({
                    "category": "Hyperglycemia",
                    "severity": "warning",
                    "message": f"Elevated Blood Glucose ({bg} mg/dL).",
                    "recommendation": "Review postprandial glucose management and dietary compliance.",
                    "reference": "ADA Standards of Medical Care in Diabetes",
                })
            elif bg < 70:
                alerts.append({
                    "category": "Hypoglycemia",
                    "severity": "critical",
                    "message": f"Hypoglycemia (Glucose: {bg} mg/dL).",
                    "recommendation": "Administer fast-acting carbohydrates. Review sulfonylurea/insulin dosages.",
                    "reference": "ADA Standards of Medical Care in Diabetes",
                })

        # SpO2
        spo2 = vitals.get('spo2')
        if spo2 and spo2 < 92:
            alerts.append({
                "category": "Hypoxemia",
                "severity": "critical",
                "message": f"Low Oxygen Saturation ({spo2}%).",
                "recommendation": "Assess airway and breathing. Consider supplemental oxygen therapy.",
                "reference": "BTS Guidelines for Oxygen Use",
            })

        # Heart Rate
        hr = vitals.get('heart_rate')
        if hr:
            if hr > 120:
                alerts.append({
                    "category": "Tachycardia",
                    "severity": "warning",
                    "message": f"Tachycardia (HR: {hr} bpm).",
                    "recommendation": "Perform ECG to rule out arrhythmias (e.g., AFib). Assess volume status.",
                    "reference": "ACLS Guidelines",
                })
            elif hr < 50:
                alerts.append({
                    "category": "Bradycardia",
                    "severity": "warning",
                    "message": f"Bradycardia (HR: {hr} bpm).",
                    "recommendation": "Review medication list (beta-blockers, CCBs). Check for symptoms of hypoperfusion.",
                    "reference": "ACLS Guidelines",
                })

    # 2. Evaluate ML Risk Scores
    if risks and risks.get('scores'):
        scores = risks.get('scores')
        if isinstance(scores, dict) and 'conditions' in scores:
            scores = scores['conditions']
        
        # Diabetes Risk
        dia_prob = scores.get('diabetes')
        if dia_prob and (dia_prob if isinstance(dia_prob, float) else dia_prob.get('probability', 0)) > 0.4:
            alerts.append({
                "category": "Endocrinology",
                "severity": "warning",
                "message": "High AI predicted risk for Type 2 Diabetes.",
                "recommendation": "Order HbA1c and fasting lipid panel. Initiate lifestyle counseling.",
                "reference": "UKPDS Outcomes Model Validation",
            })

        # Heart Disease / CVD Risk
        cvd_prob = scores.get('heart_disease')
        if cvd_prob and (cvd_prob if isinstance(cvd_prob, float) else cvd_prob.get('probability', 0)) > 0.3:
            alerts.append({
                "category": "Cardiology",
                "severity": "warning",
                "message": "Elevated AI predicted risk for Cardiovascular Disease.",
                "recommendation": "Calculate 10-year ASCVD risk. Consider starting moderate-to-high intensity statin.",
                "reference": "Framingham Heart Study / AHA ACC ASCVD Risk Calculator",
            })
            
        # Chronic Kidney Disease
        ckd_prob = scores.get('chronic_kidney')
        if ckd_prob and (ckd_prob if isinstance(ckd_prob, float) else ckd_prob.get('probability', 0)) > 0.35:
            alerts.append({
                "category": "Nephrology",
                "severity": "warning",
                "message": "Elevated AI predicted risk for Chronic Kidney Disease.",
                "recommendation": "Order comprehensive metabolic panel (BUN/Creatinine) and urine albumin-to-creatinine ratio (UACR).",
                "reference": "KDIGO Clinical Practice Guidelines",
            })

    # Limit to top 5 alerts based on severity
    severity_rank = {"critical": 0, "warning": 1, "info": 2}
    alerts.sort(key=lambda x: severity_rank.get(x["severity"], 3))
    
    return alerts[:5]
