from django.contrib import admin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'username', 'email', 'first_name', 'last_name', 'role', 'organisation',
        'is_active', 'invited_at', 'activated_at', 'deactivated_at',
        'created_at', 'updated_at'
    ]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    list_filter = ['role', 'organisation', 'is_active']
