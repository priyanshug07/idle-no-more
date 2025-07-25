from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'project', 'status', 'priority', 'billable', 'deadline', 'created_at']
    list_filter = ['status', 'priority', 'billable', 'project', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['employees']
