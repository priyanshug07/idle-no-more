from django.db import models
from employee.models import Employee
from time_tracking.models import TimeTracking

class Screenshot(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='screenshots')
    time_tracking = models.ForeignKey(TimeTracking, on_delete=models.CASCADE, related_name='screenshots')
    file_path = models.CharField(max_length=500, help_text='Path to the screenshot file')
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField(help_text='File size in bytes')
    permissions_granted = models.BooleanField(default=False, help_text='Whether screen recording permissions were granted')
    taken_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.username} - {self.file_name} ({self.taken_at})"
