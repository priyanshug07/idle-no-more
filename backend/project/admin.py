from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'description', 'billable', 'deadline', 'created_at', 'updated_at']
    list_filter = ['billable', 'created_at', 'updated_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['employees']
