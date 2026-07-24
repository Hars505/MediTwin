"""
Serializers for user registration, login, and profile management.
"""
import re
from datetime import date

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


# ══════════════════════════════════════════════════════════════════════
# Shared validators
# ══════════════════════════════════════════════════════════════════════

NAME_RE = re.compile(r"^[A-Za-z][A-Za-z\s'-]*$")
PHONE_RE = re.compile(r"^\+?[0-9]{7,15}$")
# Children under 10 cannot self-register. The cap is computed lazily so tests
# can monkey-patch it if they need to assert behavior on a fixed date.
MIN_AGE_YEARS = 10
DOB_MIN_YEAR = 1900


def _dob_max_date(today=None):
    today = today or date.today()
    try:
        return today.replace(year=today.year - MIN_AGE_YEARS)
    except ValueError:
        # Feb 29 on a non-leap year — fall back to Feb 28.
        return today.replace(month=2, day=28, year=today.year - MIN_AGE_YEARS)


def validate_dob(value):
    """Reject dates before 1900 or younger than MIN_AGE_YEARS."""
    if value is None:
        return  # Allow blank; required-ness is enforced at the field level.
    if value.year < DOB_MIN_YEAR:
        raise serializers.ValidationError(
            f"Date of birth cannot be before {DOB_MIN_YEAR}."
        )
    if value > _dob_max_date():
        raise serializers.ValidationError(
            f"You must be at least {MIN_AGE_YEARS} years old to register."
        )


def calculate_age(dob):
    """Integer years since `dob`, or None if dob is falsy."""
    if not dob:
        return None
    today = date.today()
    age = today.year - dob.year - (
        (today.month, today.day) < (dob.month, dob.day)
    )
    return age


def _validate_name_field(value, label):
    s = (value or "").strip()
    if not s:
        raise serializers.ValidationError(f"{label} is required.")
    if len(s) > 50:
        raise serializers.ValidationError(f"{label} must be 50 characters or fewer.")
    if not NAME_RE.match(s):
        raise serializers.ValidationError(
            f"{label} can only contain letters, spaces, hyphens, and apostrophes."
        )
    return s


def _validate_phone_field(value):
    if value in (None, ""):
        return value
    cleaned = re.sub(r"[\s\-()]", "", str(value))
    if not PHONE_RE.match(cleaned):
        raise serializers.ValidationError(
            "Phone must be 7-15 digits (a leading + is allowed)."
        )
    return cleaned


# ══════════════════════════════════════════════════════════════════════
# Serializers
# ══════════════════════════════════════════════════════════════════════


class RegisterSerializer(serializers.ModelSerializer):
    """Handles new user registration with password confirmation."""
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'role', 'phone',
            'date_of_birth', 'gender',
        )
        extra_kwargs = {
            'date_of_birth': {'required': True},
            'gender': {'required': True},
        }

    def validate_date_of_birth(self, value):
        validate_dob(value)
        return value

    def validate_first_name(self, value):
        return _validate_name_field(value, "First name")

    def validate_last_name(self, value):
        return _validate_name_field(value, "Last name")

    def validate_phone(self, value):
        return _validate_phone_field(value)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Read/update user profile information."""

    # MongoDB ObjectId cannot be cast to int — serialize as string
    id = serializers.CharField(read_only=True)

    # Read-only age derived from date_of_birth so clients never have to keep it
    # in sync. The user model has no `age` field, so this is a virtual field.
    age = serializers.SerializerMethodField()
    is_admin_user = serializers.SerializerMethodField()
    is_doctor = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'date_of_birth', 'gender', 'age',
            'onboarding_complete', 'date_joined',
            'is_admin_user', 'is_doctor',
        )
        read_only_fields = ('id', 'username', 'role', 'date_joined', 'age', 'is_admin_user', 'is_doctor')

    def get_age(self, obj):
        return calculate_age(obj.date_of_birth)

    def get_is_admin_user(self, obj):
        return obj.role == 'admin'

    def get_is_doctor(self, obj):
        return obj.role == 'doctor'

    def validate_date_of_birth(self, value):
        if value is not None:
            validate_dob(value)
        return value

    def validate_first_name(self, value):
        return _validate_name_field(value, "First name")

    def validate_last_name(self, value):
        return _validate_name_field(value, "Last name")

    def validate_phone(self, value):
        return _validate_phone_field(value)


class ChangePasswordSerializer(serializers.Serializer):
    """Change password for authenticated user."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True, validators=[validate_password]
    )

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class DoctorProfileSerializer(serializers.Serializer):
    """Validate doctor profile fields for MongoDB storage."""
    specialization = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    years_of_experience = serializers.IntegerField(required=False, min_value=0)
    consultation_fee = serializers.FloatField(required=False, min_value=0)
    bio = serializers.CharField(required=False, allow_blank=True)
    available_slots = serializers.ListField(
        child=serializers.DictField(), required=False
    )
