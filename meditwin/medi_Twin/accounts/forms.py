"""Django forms for account registration."""

import re
from datetime import date

from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from .serializers import (
    DOB_MIN_YEAR,
    MIN_AGE_YEARS,
    NAME_RE,
    PHONE_RE,
)

User = get_user_model()


def _dob_max_date(today=None):
    today = today or date.today()
    try:
        return today.replace(year=today.year - MIN_AGE_YEARS)
    except ValueError:
        return today.replace(month=2, day=28, year=today.year - MIN_AGE_YEARS)


def _validate_dob_field(value):
    if value is None:
        return value
    if value.year < DOB_MIN_YEAR:
        raise ValidationError(f"Date of birth cannot be before {DOB_MIN_YEAR}.")
    if value > _dob_max_date():
        raise ValidationError(
            f"You must be at least {MIN_AGE_YEARS} years old to register."
        )
    return value


def _validate_name_field(value, label):
    s = (value or "").strip()
    if not s:
        raise ValidationError(f"{label} is required.")
    if len(s) > 50:
        raise ValidationError(f"{label} must be 50 characters or fewer.")
    if not NAME_RE.match(s):
        raise ValidationError(
            f"{label} can only contain letters, spaces, hyphens, and apostrophes."
        )
    return s


def _validate_phone_field(value):
    if value in (None, ""):
        return value
    cleaned = re.sub(r"[\s\-()]", "", str(value))
    if not PHONE_RE.match(cleaned):
        raise ValidationError(
            "Phone must be 7-15 digits (a leading + is allowed)."
        )
    return cleaned


class RegisterForm(UserCreationForm):
    """Plain Django registration form for the custom MediTwin user model."""

    class Meta:
        model = User
        fields = (
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'phone',
            'date_of_birth',
            'gender',
        )
        widgets = {
            'date_of_birth': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean_first_name(self):
        return _validate_name_field(self.cleaned_data.get('first_name'), "First name")

    def clean_last_name(self):
        return _validate_name_field(self.cleaned_data.get('last_name'), "Last name")

    def clean_phone(self):
        return _validate_phone_field(self.cleaned_data.get('phone'))

    def clean_date_of_birth(self):
        return _validate_dob_field(self.cleaned_data.get('date_of_birth'))
