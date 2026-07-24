"""
Serializers for patient health profiles, vitals, and lifestyle logs.
Since data lives in MongoDB (not Django ORM), these are plain Serializers.
"""
from rest_framework import serializers


class DemographicsSerializer(serializers.Serializer):
    age = serializers.IntegerField(min_value=0, max_value=150)
    height_cm = serializers.FloatField(min_value=30, max_value=300)
    weight_kg = serializers.FloatField(min_value=1, max_value=500)
    bmi = serializers.FloatField(read_only=True, required=False)
    blood_type = serializers.CharField(max_length=5, required=False, default='')


class HealthProfileSerializer(serializers.Serializer):
    """Full health profile document."""
    _id = serializers.CharField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)

    # Demographics
    age = serializers.IntegerField(min_value=0, max_value=150)
    height_cm = serializers.FloatField(min_value=30, max_value=300)
    weight_kg = serializers.FloatField(min_value=1, max_value=500)
    bmi = serializers.FloatField(required=False)
    blood_type = serializers.CharField(max_length=5, required=False, default='')

    # Medical history
    family_history = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    medical_conditions = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    medications = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    allergies = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )

    # Lifestyle baseline
    smoking = serializers.BooleanField(required=False, default=False)
    alcohol = serializers.CharField(required=False, default='none')
    exercise_frequency = serializers.CharField(required=False, default='sedentary')
    diet_type = serializers.CharField(required=False, default='mixed')
    
    # User Preferences & Gamification
    tour_completed = serializers.BooleanField(required=False, default=False)
    achievements = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )

    def validate(self, data):
        # Auto-calculate BMI if height and weight present
        h = data.get('height_cm')
        w = data.get('weight_kg')
        if h and w and h > 0:
            data['bmi'] = round(w / ((h / 100) ** 2), 1)
        return data


class VitalsSerializer(serializers.Serializer):
    """A single vitals snapshot."""
    _id = serializers.CharField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    heart_rate = serializers.IntegerField(min_value=20, max_value=300, required=False)
    systolic_bp = serializers.IntegerField(min_value=50, max_value=300, required=False)
    diastolic_bp = serializers.IntegerField(min_value=20, max_value=200, required=False)
    spo2 = serializers.FloatField(min_value=50, max_value=100, required=False)
    blood_glucose = serializers.FloatField(min_value=20, max_value=600, required=False)
    temperature = serializers.FloatField(min_value=30, max_value=45, required=False)
    respiratory_rate = serializers.IntegerField(min_value=5, max_value=60, required=False)
    recorded_at = serializers.DateTimeField(read_only=True)


class LifestyleLogSerializer(serializers.Serializer):
    """Daily lifestyle entry."""
    _id = serializers.CharField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    sleep_hours = serializers.FloatField(min_value=0, max_value=24, required=False)
    steps = serializers.IntegerField(min_value=0, required=False)
    water_intake_ml = serializers.IntegerField(min_value=0, required=False)
    meals = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    stress_level = serializers.IntegerField(min_value=1, max_value=10, required=False)
    exercise_minutes = serializers.IntegerField(min_value=0, required=False, default=0)
    notes = serializers.CharField(required=False, default='', allow_blank=True)
    date = serializers.CharField(required=False)
    created_at = serializers.DateTimeField(read_only=True)
