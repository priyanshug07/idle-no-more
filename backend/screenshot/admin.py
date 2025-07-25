from django.contrib import admin
from .models import Screenshot

@admin.register(Screenshot)
class ScreenshotAdmin(admin.ModelAdmin):
    list_display = ['id', 'employee', 'time_tracking', 'file_name', 'file_size', 'permissions_granted', 'taken_at']
    list_filter = ['permissions_granted', 'taken_at', 'created_at', 'employee']
    search_fields = ['employee__username', 'employee__email', 'file_name']
    date_hierarchy = 'taken_at'
