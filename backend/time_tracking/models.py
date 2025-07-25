from django.db import models
from employee.models import Employee
from task.models import Task

class TimeTracking(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='time_entries')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_entries')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    device_details = models.JSONField(blank=True, null=True, default=dict)
    timezone = models.CharField(max_length=64, blank=True, null=True, help_text='Timezone name, e.g. Asia/Kolkata')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def set_device_details(self, mac=None, ip=None, device_details=None):
        """
        Set device details for the time tracking entry.
        """
        self.device_details = {
            'mac': mac,
            'ip': ip,
            'device_details': device_details
        }

    def __str__(self):
        return f"{self.employee.username} - {self.task.name} ({self.start_time})"
