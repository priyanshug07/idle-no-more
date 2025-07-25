from django.contrib import admin
from .models import TimeTracking

@admin.register(TimeTracking)
class TimeTrackingAdmin(admin.ModelAdmin):
    list_display = ['id', 'employee', 'task', 'start_time', 'end_time', 'is_active', 'created_at']
    list_filter = ['is_active', 'start_time', 'created_at', 'employee', 'task__project']
    search_fields = ['employee__username', 'employee__email', 'task__name', 'description']
    date_hierarchy = 'start_time'
