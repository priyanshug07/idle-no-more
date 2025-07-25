from django.db import models
from employee.models import Employee

# Create your models here.

class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    employees = models.ManyToManyField(Employee, related_name='projects')
    statuses = models.JSONField(blank=True, null=True, default=list)
    priorities = models.JSONField(blank=True, null=True, default=list)
    billable = models.BooleanField(default=False)
    deadline = models.BigIntegerField(blank=True, null=True, help_text='Date in milliseconds when project must be done')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
