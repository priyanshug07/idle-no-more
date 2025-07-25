from django.db import models
from employee.models import Employee
from project.models import Project

class Task(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    employees = models.ManyToManyField(Employee, related_name='tasks')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    deadline = models.BigIntegerField(blank=True, null=True, help_text='Date in milliseconds when task must be done')
    status = models.CharField(max_length=100, blank=True, null=True)
    labels = models.JSONField(blank=True, null=True, default=list)
    priority = models.CharField(max_length=100, blank=True, null=True)
    billable = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
