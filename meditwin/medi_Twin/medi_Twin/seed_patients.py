"""
Seed 4 realistic patients with full data across all MongoDB collections.

Usage:
    python manage.py shell -c "from medi_Twin.seed_patients import run; run()"
"""
import random
from datetime import datetime, timezone, timedelta
from django.contrib.auth import get_user_model
from medi_Twin.mongo import get_collection

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

def _dt(**kwargs):
    return datetime.now(timezone.utc) - timedelta(**kwargs)

def _randint(lo, hi):
    return random.randint(lo, hi)

def _rand(lo, hi):
    return round(random.uniform(lo, hi), 1)

def run():
    print("\n--- Seeding 4 patients ---\n")

    created_users = []
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
        created_users.append(user)
        print(f"  {'CREATED' if was else 'EXISTS'} {info['username']} (id={user.id})")

    hp_col = get_collection("health_profiles")
    vt_col = get_collection("vitals_history")
    ls_col = get_collection("lifestyle_logs")
    rs_col = get_collection("risk_scores")

    for i, user in enumerate(created_users):
        info = PATIENTS[i]
        pid = user.id
        p = info["profile"]

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
                "achievements": ["first_vitals", "first_report"] if i < 3 else ["first_vitals"],
                "created_at": _dt(days=30),
                "updated_at": _dt(days=1),
            })
            print(f"  health_profiles -> {info['username']}")

        if vt_col.count_documents({"user_id": pid}) == 0:
            vb = info["vitals_base"]
            for day in range(14, -1, -1):
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
            print(f"  vitals_history -> {info['username']} (15 records)")

        if ls_col.count_documents({"user_id": pid}) == 0:
            meals_pool = [
                ["idli sambar", "rice dal", "roti sabzi"],
                ["eggs toast", "chicken curry", "salad"],
                ["smoothie", "paneer wrap", "soup"],
                ["oatmeal", "fish rice", "stir fry"],
            ]
            for day in range(7, -1, -1):
                d = _dt(days=day)
                ls_col.insert_one({
                    "user_id": pid,
                    "sleep_hours": _rand(5.5, 8.5),
                    "steps": _randint(2000, 12000),
                    "water_intake_ml": _randint(1200, 3200),
                    "meals": random.choice(meals_pool),
                    "stress_level": _randint(2, 9),
                    "exercise_minutes": _randint(0, 60),
                    "notes": "",
                    "date": d.strftime("%Y-%m-%d"),
                    "created_at": d,
                })
            print(f"  lifestyle_logs -> {info['username']} (8 records)")

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
                        {"feature": "BMI", "value": p.get("bmi", 25), "impact_pct": round(prob * 10, 1),
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

    print(f"\nDone. {len(created_users)} patients created. Password: {PASSWORD}")
    print("Collections: health_profiles, vitals_history, lifestyle_logs, risk_scores")