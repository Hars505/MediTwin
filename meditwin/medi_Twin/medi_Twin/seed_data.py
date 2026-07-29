"""
Seed script — populates all MediTwin MongoDB collections with realistic dummy data.

Also creates Django users (patients + doctors + admin) in SQLite so the FKs are valid.

Usage (inside .venv):
    python manage.py shell -c "from medi_Twin.seed_data import seed; seed()"
"""
import random
from datetime import datetime, timezone, timedelta
from django.contrib.auth import get_user_model
from medi_Twin.mongo import get_collection

User = get_user_model()

# ── Helpers ──────────────────────────────────────────────────────────

def _dt(days_ago=0, hours_ago=0):
    return datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)


def _rand(low, high):
    return round(random.uniform(low, high), 1)


# ── 1. Create Django Users ──────────────────────────────────────────

USERS = [
    {'username': 'patient_alice',  'first_name': 'Alice',  'last_name': 'Sharma',   'email': 'alice@demo.com',  'role': 'patient', 'gender': 'female', 'phone': '9876543210'},
    {'username': 'patient_bob',    'first_name': 'Bob',    'last_name': 'Patel',    'email': 'bob@demo.com',    'role': 'patient', 'gender': 'male',   'phone': '9876543211'},
    {'username': 'patient_carol',  'first_name': 'Carol',  'last_name': 'Gupta',    'email': 'carol@demo.com',  'role': 'patient', 'gender': 'female', 'phone': '9876543212'},
    {'username': 'rahul_demo',     'first_name': 'Rahul',  'last_name': 'Verma',    'email': 'rahul.verma@demo.com',  'role': 'patient', 'gender': 'male',   'phone': '9876543100'},
    {'username': 'doctor_raj',     'first_name': 'Dr. Raj','last_name': 'Mehta',    'email': 'raj@demo.com',    'role': 'doctor',  'gender': 'male',   'phone': '9876543220'},
    {'username': 'doctor_priya',   'first_name': 'Dr. Priya','last_name': 'Singh', 'email': 'priya@demo.com',  'role': 'doctor',  'gender': 'female', 'phone': '9876543221'},
    {'username': 'doctor_ananya',  'first_name': 'Ananya','last_name': 'Sharma',   'email': 'ananya.sharma@meditwin.com', 'role': 'doctor', 'gender': 'female', 'phone': '9876543200'},
    {'username': 'admin_sys',      'first_name': 'System', 'last_name': 'Admin',    'email': 'admin@demo.com',  'role': 'admin',   'gender': 'male',   'phone': '9876543230'},
]

PASSWORD = 'MediTwin@123'


def create_users():
    created = []
    for u in USERS:
        user, was_created = User.objects.get_or_create(
            username=u['username'],
            defaults={
                'first_name': u['first_name'],
                'last_name': u['last_name'],
                'email': u['email'],
                'role': u['role'],
                'gender': u['gender'],
                'phone': u['phone'],
                'onboarding_complete': u['role'] == 'patient',
                'is_staff': u['role'] == 'admin',
            }
        )
        if was_created:
            user.set_password(PASSWORD)
            user.save()
        created.append(user)
        status = 'CREATED' if was_created else 'EXISTS'
        print(f"  [{status}] {u['username']} (id={user.id}, role={u['role']})")
    return created


# ── 2. Health Profiles ──────────────────────────────────────────────

PROFILES = [
    {
        'demographics': {'age': 32, 'height_cm': 165.0, 'weight_kg': 72.0, 'bmi': 26.4, 'blood_type': 'B+'},
        'family_history': ['diabetes', 'hypertension'],
        'medical_conditions': [],
        'medications': [],
        'allergies': ['penicillin'],
        'lifestyle': {'smoking': False, 'alcohol': 'occasional', 'exercise_frequency': 'moderate', 'diet_type': 'vegetarian'},
    },
    {
        'demographics': {'age': 48, 'height_cm': 178.0, 'weight_kg': 95.0, 'bmi': 30.0, 'blood_type': 'O+'},
        'family_history': ['heart disease', 'diabetes'],
        'medical_conditions': ['pre-diabetes'],
        'medications': ['metformin'],
        'allergies': [],
        'lifestyle': {'smoking': True, 'alcohol': 'regular', 'exercise_frequency': 'sedentary', 'diet_type': 'mixed'},
    },
    {
        'demographics': {'age': 27, 'height_cm': 160.0, 'weight_kg': 58.0, 'bmi': 22.7, 'blood_type': 'A+'},
        'family_history': [],
        'medical_conditions': ['PCOS'],
        'medications': ['oral contraceptive'],
        'allergies': ['sulfa'],
        'lifestyle': {'smoking': False, 'alcohol': 'none', 'exercise_frequency': 'active', 'diet_type': 'mixed'},
    },
    {
        'demographics': {'age': 35, 'height_cm': 172.0, 'weight_kg': 73.0, 'bmi': 24.7, 'blood_type': 'O+'},
        'family_history': ['diabetes'],
        'medical_conditions': [],
        'medications': [],
        'allergies': [],
        'lifestyle': {'smoking': False, 'alcohol': 'occasional', 'exercise_frequency': 'moderate', 'diet_type': 'mixed'},
    },
]


def seed_health_profiles(patients):
    col = get_collection('health_profiles')
    for i, patient in enumerate(patients):
        if col.find_one({'user_id': patient.id}):
            continue
        doc = {
            'user_id': patient.id,
            **PROFILES[i],
            'created_at': _dt(days_ago=30),
            'updated_at': _dt(days_ago=2),
        }
        col.insert_one(doc)
    print(f"  ✅ health_profiles — {len(patients)} profiles seeded")


# ── 3. Vitals History ───────────────────────────────────────────────

def seed_vitals(patients):
    col = get_collection('vitals_history')
    if col.count_documents({}) > 0:
        print("  ⏭ vitals_history — already has data, skipping")
        return
    for patient in patients:
        for day in range(14, -1, -1):
            doc = {
                'user_id': patient.id,
                'heart_rate': random.randint(62, 105),
                'systolic_bp': random.randint(110, 155),
                'diastolic_bp': random.randint(65, 95),
                'spo2': _rand(94, 99),
                'blood_glucose': _rand(80, 180),
                'temperature': _rand(36.2, 37.4),
                'respiratory_rate': random.randint(14, 22),
                'recorded_at': _dt(days_ago=day),
            }
            col.insert_one(doc)
    print(f"  ✅ vitals_history — {15 * len(patients)} records seeded (15 days × {len(patients)} patients)")


# ── 4. Lifestyle Logs ───────────────────────────────────────────────

def seed_lifestyle(patients):
    col = get_collection('lifestyle_logs')
    if col.count_documents({}) > 0:
        print("  ⏭ lifestyle_logs — already has data, skipping")
        return
    meals_options = [
        ['oatmeal', 'dal rice', 'salad'],
        ['eggs toast', 'chicken curry rice', 'soup'],
        ['smoothie', 'paneer wrap', 'pasta'],
    ]
    for patient in patients:
        for day in range(7, -1, -1):
            d = _dt(days_ago=day)
            doc = {
                'user_id': patient.id,
                'sleep_hours': _rand(5, 9),
                'steps': random.randint(2000, 12000),
                'water_intake_ml': random.randint(1000, 3500),
                'meals': random.choice(meals_options),
                'stress_level': random.randint(2, 9),
                'exercise_minutes': random.randint(0, 60),
                'notes': '',
                'date': d.strftime('%Y-%m-%d'),
                'created_at': d,
            }
            col.insert_one(doc)
    print(f"  ✅ lifestyle_logs — {8 * len(patients)} entries seeded")


# ── 5. Risk Scores ──────────────────────────────────────────────────

def seed_risk_scores(patients):
    col = get_collection('risk_scores')
    if col.count_documents({}) > 0:
        print("  ⏭ risk_scores — already has data, skipping")
        return
    conditions = ['diabetes', 'heart_disease', 'hypertension']
    levels = ['low', 'moderate', 'high', 'critical']
    for patient in patients:
        for day in range(6, -1, -2):
            scores = {}
            for cond in conditions:
                prob = round(random.uniform(0.1, 0.85), 4)
                lvl = levels[min(int(prob * 4), 3)]
                scores[cond] = {'probability': prob, 'risk_level': lvl}
            doc = {
                'user_id': patient.id,
                'scores': scores,
                'shap_explanations': {
                    'diabetes': {
                        'overall_risk': scores['diabetes']['probability'],
                        'risk_level': scores['diabetes']['risk_level'],
                        'top_factors': [
                            {'feature': 'BMI', 'value': 30.0, 'impact_pct': 5.0, 'direction': 'increasing',
                             'description': 'Your BMI of 30.0 is contributing +5.0% to Diabetes risk'},
                        ],
                    },
                },
                'calculated_at': _dt(days_ago=day),
            }
            col.insert_one(doc)
    print(f"  ✅ risk_scores — {4 * len(patients)} calculations seeded")


# ── 6. Chatbot Sessions ────────────────────────────────────────────

def seed_chatbot_sessions(patients):
    col = get_collection('chatbot_sessions')
    if col.count_documents({}) > 0:
        print("  ⏭ chatbot_sessions — already has data, skipping")
        return
    conversations = [
        [
            ('user', 'I have been having chest pain for 2 days'),
            ('bot',  'Chest pain can have many causes. Is the pain sharp or dull? Does it worsen with breathing?'),
            ('user', 'It is a dull ache, gets worse when I lie down'),
            ('bot',  'Dull chest pain worsening when lying down could indicate acid reflux or pericarditis. I recommend consulting a doctor soon.'),
        ],
        [
            ('user', 'I feel very fatigued and dizzy lately'),
            ('bot',  'Fatigue and dizziness can be caused by anemia, dehydration, or blood pressure issues. Have you checked your blood pressure recently?'),
            ('user', 'No, I haven\'t. I also have headaches'),
            ('bot',  'The combination of fatigue, dizziness, and headaches warrants a checkup. Please monitor your blood pressure and consult your physician.'),
        ],
    ]
    severities = ['low', 'moderate', 'urgent']
    for i, patient in enumerate(patients[:2]):
        convo = conversations[i]
        symptoms = []
        for role, msg in convo:
            if role == 'user':
                for kw in ['chest pain', 'fatigue', 'dizzy', 'headache']:
                    if kw in msg.lower():
                        symptoms.append(kw)
        doc = {
            'user_id': patient.id,
            'messages': [
                {'role': role, 'content': msg, 'timestamp': _dt(days_ago=3, hours_ago=j), 'metadata': {}}
                for j, (role, msg) in enumerate(convo)
            ],
            'symptoms_logged': list(set(symptoms)),
            'triage_severity': random.choice(severities),
            'status': 'closed',
            'created_at': _dt(days_ago=3),
            'updated_at': _dt(days_ago=3),
        }
        col.insert_one(doc)
    print(f"  ✅ chatbot_sessions — 2 sessions seeded with realistic conversations")


# ── 7. Reports (patient_id + doctor_id FKs) ────────────────────────

def seed_reports(patients, doctors):
    col = get_collection('reports')
    if col.count_documents({}) > 0:
        print("  ⏭ reports — already has data, skipping")
        return
    report_types = ['full', 'summary', 'vitals', 'risk']
    for patient in patients:
        doctor = random.choice(doctors)
        for day in [10, 5, 1]:
            doc = {
                'patient_id': patient.id,
                'doctor_id': doctor.id,
                'filename': f'meditwin_report_{patient.id}_{_dt(days_ago=day).strftime("%Y%m%d_%H%M%S")}.pdf',
                'report_type': random.choice(report_types),
                'notes': f'Routine checkup report for {patient.first_name}',
                'generated_at': _dt(days_ago=day),
            }
            col.insert_one(doc)
    print(f"  ✅ reports — {3 * len(patients)} reports seeded (linked to patients & doctors)")


# ══════════════════════════════════════════════════════════════════════
# Main entry point
# ══════════════════════════════════════════════════════════════════════

def seed():
    """Run all seeders."""
    print("\n🌱 Seeding MediTwin database...\n")

    # Step 1 — Django users
    print("── Django Users ──")
    users = create_users()
    patients = [u for u in users if u.role == 'patient']
    doctors = [u for u in users if u.role == 'doctor']

    # Step 2 — MongoDB collections
    print("\n── MongoDB Collections ──")
    seed_health_profiles(patients)
    seed_vitals(patients)
    seed_lifestyle(patients)
    seed_risk_scores(patients)
    seed_chatbot_sessions(patients)
    seed_reports(patients, doctors)

    print("\n🎉 Seed complete!")
    print(f"   {len(patients)} patients, {len(doctors)} doctors, 1 admin")
    print(f"   Password for all users: {PASSWORD}")
    print("   Open MongoDB Compass to verify data in meditwin_db")


if __name__ == '__main__':
    seed()
