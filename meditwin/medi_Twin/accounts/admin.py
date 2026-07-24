from django.contrib import admin
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'onboarding_complete', 'date_joined')
    list_filter = ('role', 'onboarding_complete')
    search_fields = ('username', 'email', 'first_name', 'last_name')
