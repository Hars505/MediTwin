"""
Seed all 4 patients with 4 months of history: vitals, lifestyle, reports,
chatbot sessions, and appointments.

Usage:
    python manage.py shell -c "from medi_Twin.seed_demo_data import run; run()"
"""
import random
import os
from datetime import datetime, timezone, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from medi_Twin.mongo import get_collection
from reports.generator import generate_health_report
from reports.mongo_models import save_report

User = get_user_model()
PASSWORD = "MediTwin@123"

PATIENTS = [
    {
        "username": "anita_desai", "first_name": "Anita", "last_name": "Desai",
        "email": "anita@demo.com", "role": "patient", "gender": "female", "phone": "9876543301",
        "profile": {
            "age": 45, "height_cm": 162.0, "weight_kg": 78.0, "blood_type": "A+",
            "family_history": ["diabetes", "hypertension"],
            "medical_conditions": ["type2_diabetes", "hypertension"],
            "medications": ["metformin 500mg", "amlodipine 5mg"],
            "allergies": ["shellfish"],
            "smoking": False, "alcohol": "occasional", "exercise_frequency": "sedentary", "diet_type": "vegetarian",
        },
        "vitals_base": {"hr": (72, 88), "sys": (125, 145), "dias": (80, 95), "spo2": (95, 98), "glucose": (140, 190), "temp": (36.3, 36.8), "rr": (16, 20)},
        "risks": {"diabetes": 0.78, "heart_disease": 0.45, "hypertension": 0.72},
    },
    {
        "username": "ravi_nair", "first_name": "Ravi", "last_name": "Nair",
        "email": "ravi@demo.com", "role": "patient", "gender": "male", "phone": "9876543302",
        "profile": {
            "age": 34, "height_cm": 175.0, "weight_kg": 82.0, "blood_type": "O+",
            "family_history": ["heart_disease"],
            "medical_conditions": [],
            "medications": [],
            "allergies": [],
            "smoking": True, "alcohol": "regular", "exercise_frequency": "moderate", "diet_type": "mixed",
        },
        "vitals_base": {"hr": (68, 82), "sys": (115, 135), "dias": (70, 85), "spo2": (96, 99), "glucose": (85, 110), "temp": (36.4, 36.9), "rr": (14, 18)},
        "risks": {"diabetes": 0.22, "heart_disease": 0.55, "hypertension": 0.35},
    },
    {
        "username": "sunita_kapoor", "first_name": "Sunita", "last_name": "Kapoor",
        "email": "sunita@demo.com", "role": "patient", "gender": "female", "phone": "9876543303",
        "profile": {
            "age": 62, "height_cm": 158.0, "weight_kg": 68.0, "blood_type": "B+",
            "family_history": ["diabetes", "heart_disease"],
            "medical_conditions": ["coronary_artery_disease", "hypothyroidism"],
            "medications": ["atorvastatin 20mg", "levothyroxine 50mcg", "aspirin 75mg"],
            "allergies": ["penicillin", "codeine"],
            "smoking": False, "alcohol": "none", "exercise_frequency": "low", "diet_type": "vegetarian",
        },
        "vitals_base": {"hr": (70, 90), "sys": (130, 160), "dias": (75, 95), "spo2": (93, 97), "glucose": (100, 145), "temp": (36.2, 36.7), "rr": (16, 22)},
        "risks": {"diabetes": 0.55, "heart_disease": 0.82, "hypertension": 0.88},
    },
    {
        "username": "arjun_mehta", "first_name": "Arjun", "last_name": "Mehta",
        "email": "arjun@demo.com", "role": "patient", "gender": "male", "phone": "9876543304",
        "profile": {
            "age": 27, "height_cm": 180.0, "weight_kg": 74.0, "blood_type": "AB+",
            "family_history": [],
            "medical_conditions": [],
            "medications": [],
            "allergies": ["dust"],
            "smoking": False, "alcohol": "social", "exercise_frequency": "active", "diet_type": "mixed",
        },
        "vitals_base": {"hr": (60, 75), "sys": (110, 125), "dias": (65, 80), "spo2": (97, 100), "glucose": (78, 100), "temp": (36.4, 37.0), "rr": (12, 16)},
        "risks": {"diabetes": 0.08, "heart_disease": 0.12, "hypertension": 0.10},
    },
]

DAYS = 120
REPORT_INTERVAL_DAYS = 14

CHAT_SYMPTOM_POOL = [
    "frequent headaches", "fatigue", "joint pain", "chest tightness",
    "dizziness", "shortness of breath", "blurred vision", "numbness in hands",
    "insomnia", "heart palpitations", "ankle swelling", "dry cough",
]

CHAT_MESSAGES_USER = [
    "I've been feeling tired lately, especially after meals.",
    "My blood pressure readings have been higher than usual this week.",
    "I'm concerned about my family history of heart disease.",
    "Should I be worried about my fasting glucose levels?",
    "I had a mild headache for the past three days.",
    "What lifestyle changes would help reduce my risk scores?",
    "Is it safe to exercise with my current vitals?",
    "How often should I check my blood pressure at home?",
]

CHAT_MESSAGES_BOT = [
    "Thank you for sharing. Based on your profile, I'd recommend monitoring your vitals daily and logging any symptoms. Would you like to schedule a follow-up with your doctor?",
    "I see your recent readings. It's important to stay consistent with your medication schedule. Let me suggest tracking your BP at the same time each morning.",
    "That's a valid concern. Your risk assessment shows moderate probability — lifestyle modifications like a balanced diet and regular walks can make a meaningful difference over 3-6 months.",
    "Your glucose levels have been within your expected range recently. Continue monitoring and maintain your current diet plan. I'd suggest reviewing this with your doctor at your next visit.",
    "Headaches can have many causes. Ensure you're staying hydrated and getting adequate sleep. If they persist beyond a week, please consult your physician.",
    "Great question! Even moderate exercise — 20-30 minutes of walking daily — can improve cardiovascular metrics. Start slow and gradually increase intensity.",
    "For your current health status, light to moderate exercise is recommended. Avoid high-intensity workouts until discussing with your doctor.",
    "Checking BP once in the morning (before medication) and once in the evening gives a good picture. Log the readings so we can track trends over time.",
]

MEALS_POOL = [
    ["idli sambar", "rice dal", "roti sabzi"],
    ["eggs toast", "chicken curry", "salad"],
    ["smoothie", "paneer wrap", "soup"],
    ["oatmeal", "fish rice", "stir fry"],
    ["dosa chutney", "quinoa bowl", "grilled chicken"],
    ["paratha yogurt", "biryani raita", "fruit bowl"],
    ["poha peanuts", "dal khichdi", "vegetable curry"],
    ["upma", "chole bhature", "tandoori fish"],
]

def _dt(**kwargs):
    return datetime.now(timezone.utc) - timedelta(**kwargs)

def _randint(lo, hi):
    return random.randint(lo, hi)

def _rand(lo, hi):
    return round(random.uniform(lo, hi), 1)

def run():
    print("\n--- Seeding all 4 patients with 4 months data + reports + chatbot + appointments ---\n")

    os.makedirs(settings.REPORTS_DIR, exist_ok=True)

    hp_col = get_collection("health_profiles")
    vt_col = get_collection("vitals_history")
    ls_col = get_collection("lifestyle_logs")
    rs_col = get_collection("risk_scores")
    ch_col = get_collection("chatbot_sessions")
    ap_col = get_collection("appointments")

    doctor = User.objects.filter(role='doctor').first()

    for info in PATIENTS:
        user, was = User.objects.get_or_create(
            username=info["username"],
            defaults={
                "first_name": info["first_name"],
                "last_name": info["last_name"],
                "email": info["email"],
                "role": info["role"],
                "gender": info["gender"],
                "phone": info["phone"],
                "onboarding_complete": True,
            },
        )
        if was:
            user.set_password(PASSWORD)
            user.save()
        pid = user.id
        print(f"  {'CREATED' if was else 'EXISTS'} {info['username']} (id={pid})")

        p = info["profile"]

        # ── Health profile ──────────────────────────────────────────
        if not hp_col.find_one({"user_id": pid}):
            hp_col.insert_one({
                "user_id": pid,
                "demographics": {
                    "age": p["age"], "height_cm": p["height_cm"],
                    "weight_kg": p["weight_kg"],
                    "bmi": round(p["weight_kg"] / ((p["height_cm"] / 100) ** 2), 1),
                    "blood_type": p["blood_type"],
                },
                "family_history": p["family_history"],
                "medical_conditions": p["medical_conditions"],
                "medications": p["medications"],
                "allergies": p["allergies"],
                "lifestyle": {
                    "smoking": p["smoking"], "alcohol": p["alcohol"],
                    "exercise_frequency": p["exercise_frequency"],
                    "diet_type": p["diet_type"],
                },
                "tour_completed": True,
                "achievements": ["first_vitals", "first_report", "lifestyle_streak"],
                "created_at": _dt(days=DAYS + 5),
                "updated_at": _dt(days=1),
            })
            print(f"  health_profile -> {info['username']}")

        # ── Vitals history (every 3-4 days) ─────────────────────────
        existing_vitals = vt_col.count_documents({"user_id": pid})
        if existing_vitals < 30:
            vt_col.delete_many({"user_id": pid})
            vb = info["vitals_base"]
            for day in range(DAYS, -1, -3 - _randint(0, 2)):
                vt_col.insert_one({
                    "user_id": pid,
                    "heart_rate": _randint(vb["hr"][0], vb["hr"][1]),
                    "systolic_bp": _randint(vb["sys"][0], vb["sys"][1]),
                    "diastolic_bp": _randint(vb["dias"][0], vb["dias"][1]),
                    "spo2": _rand(vb["spo2"][0], vb["spo2"][1]),
                    "blood_glucose": _rand(vb["glucose"][0], vb["glucose"][1]),
                    "temperature": _rand(vb["temp"][0], vb["temp"][1]),
                    "respiratory_rate": _randint(vb["rr"][0], vb["rr"][1]),
                    "recorded_at": _dt(days=day, hours=_randint(6, 22)),
                })
            print(f"  vitals_history -> {info['username']} (~{DAYS // 3} records)")

        # ── Lifestyle logs (daily for 4 months) ─────────────────────
        existing_lifestyle = ls_col.count_documents({"user_id": pid})
        if existing_lifestyle < 60:
            ls_col.delete_many({"user_id": pid})
            for day in range(DAYS, -1, -1):
                d = _dt(days=day)
                exercise_min = _randint(0, 60)
                steps = _randint(1500, 14000)
                if p["exercise_frequency"] == "sedentary":
                    exercise_min = _randint(0, 15)
                    steps = _randint(1500, 5000)
                elif p["exercise_frequency"] == "moderate":
                    exercise_min = _randint(15, 45)
                    steps = _randint(4000, 10000)
                elif p["exercise_frequency"] == "active":
                    exercise_min = _randint(30, 75)
                    steps = _randint(7000, 15000)

                stress = _randint(2, 9)
                if p.get("smoking"):
                    stress = _randint(3, 8)
                if p["alcohol"] in ("regular", "social"):
                    stress = _randint(2, 7)

                ls_col.insert_one({
                    "user_id": pid,
                    "sleep_hours": _rand(5.5, 8.5),
                    "steps": steps,
                    "water_intake_ml": _randint(1000, 3500),
                    "meals": random.choice(MEALS_POOL),
                    "stress_level": stress,
                    "exercise_minutes": exercise_min,
                    "notes": "",
                    "date": d.strftime("%Y-%m-%d"),
                    "created_at": d,
                })
            count = ls_col.count_documents({"user_id": pid})
            print(f"  lifestyle_logs -> {info['username']} ({count} records)")

        # ── Risk scores ─────────────────────────────────────────────
        if rs_col.count_documents({"user_id": pid}) == 0:
            r = info["risks"]
            scores = {}
            shap = {}
            for cond, prob in r.items():
                if prob >= 0.7:
                    lvl = "high"
                elif prob >= 0.4:
                    lvl = "moderate"
                else:
                    lvl = "low"
                scores[cond] = {"probability": prob, "risk_level": lvl}
                shap[cond] = {
                    "overall_risk": prob,
                    "risk_level": lvl,
                    "top_factors": [
                        {"feature": "BMI", "value": round(p["weight_kg"] / ((p["height_cm"] / 100) ** 2), 1),
                         "impact_pct": round(prob * 10, 1),
                         "direction": "increasing" if prob > 0.4 else "neutral",
                         "description": f"BMI contributing to {cond} risk"},
                    ],
                }
            rs_col.insert_one({
                "user_id": pid,
                "scores": scores,
                "shap_explanations": shap,
                "calculated_at": _dt(days=1),
            })
            print(f"  risk_scores -> {info['username']}")

        # ── PDF Reports every 14 days ───────────────────────────────
        existing_reports = get_collection("reports").count_documents({"patient_id": pid})
        if existing_reports < 6:
            get_collection("reports").delete_many({"patient_id": pid})
            profile = hp_col.find_one({"user_id": pid})
            for week in range(0, DAYS, REPORT_INTERVAL_DAYS):
                report_date = _dt(days=week)
                vitals_cursor = vt_col.find(
                    {"user_id": pid, "recorded_at": {"$gte": report_date - timedelta(days=14)}}
                ).sort("recorded_at", -1).limit(10)
                vitals_slice = list(vitals_cursor)
                risk_doc = rs_col.find_one({"user_id": pid})
                risk_scores = risk_doc.get("scores", {}) if risk_doc else {}
                risk_data = {"conditions": risk_scores, "cascade_effects": []}

                filename = generate_health_report(
                    patient_user=user,
                    profile=profile,
                    vitals_list=vitals_slice,
                    risk_scores=risk_data,
                    doctor_user=None,
                    report_date=report_date,
                )
                save_report(
                    patient_id=pid,
                    filename=filename,
                    report_type="full",
                    doctor_id=None,
                    notes=f"Auto-generated bi-weekly report (week {week // REPORT_INTERVAL_DAYS + 1})",
                )
                print(f"  report -> {filename}")
        else:
            print(f"  reports already exist for {info['username']} ({existing_reports})")

        # ── Chatbot sessions (3-4 per patient) ──────────────────────
        existing_chat = ch_col.count_documents({"user_id": pid})
        if existing_chat < 2:
            ch_col.delete_many({"user_id": pid})
            num_sessions = _randint(3, 4)
            for si in range(num_sessions):
                session_dt = _dt(days=_randint(5, DAYS - 10))
                symptoms = random.sample(CHAT_SYMPTOM_POOL, _randint(1, 3))
                num_messages = _randint(3, 6)
                messages = []
                for mi in range(num_messages):
                    role = "user" if mi % 2 == 0 else "bot"
                    pool = CHAT_MESSAGES_USER if role == "user" else CHAT_MESSAGES_BOT
                    messages.append({
                        "role": role,
                        "content": random.choice(pool),
                        "timestamp": session_dt + timedelta(minutes=mi * _randint(1, 5)),
                        "metadata": {},
                    })
                ch_col.insert_one({
                    "user_id": pid,
                    "messages": messages,
                    "symptoms_logged": symptoms,
                    "triage_severity": random.choice(["low", "moderate", "moderate", "low"]),
                    "status": "closed",
                    "created_at": session_dt,
                    "updated_at": session_dt + timedelta(hours=1),
                })
            count = ch_col.count_documents({"user_id": pid})
            print(f"  chatbot_sessions -> {info['username']} ({count})")
        else:
            print(f"  chatbot_sessions already exist for {info['username']} ({existing_chat})")

        # ── Appointments (6-8 per patient over 4 months) ────────────
        existing_appts = ap_col.count_documents({"patient_id": pid})
        if existing_appts < 4:
            ap_col.delete_many({"patient_id": pid})
            statuses = ["confirmed", "completed", "completed", "completed", "cancelled", "completed"]
            reasons = [
                "Annual health checkup", "Blood pressure review", "Diabetes management follow-up",
                "Chest discomfort evaluation", "Medication adjustment", "Lab results discussion",
                "General consultation", "Lifestyle counseling", "Follow-up on recent vitals",
                "Risk assessment review",
            ]
            num_appts = _randint(6, 8)
            for ai in range(num_appts):
                appt_dt = _dt(days=_randint(0, DAYS - 5), hours=_randint(9, 17))
                ap_col.insert_one({
                    "patient_id": pid,
                    "doctor_id": doctor.id if doctor else None,
                    "scheduled_at": appt_dt,
                    "reason": random.choice(reasons),
                    "status": statuses[ai % len(statuses)],
                    "notes": "",
                    "created_at": appt_dt - timedelta(days=_randint(1, 14)),
                })
            count = ap_col.count_documents({"patient_id": pid})
            print(f"  appointments -> {info['username']} ({count})")
        else:
            print(f"  appointments already exist for {info['username']} ({existing_appts})")

    print(f"\nDone. Password for all accounts: {PASSWORD}")
    print(f"Reports saved to: {settings.REPORTS_DIR}")
