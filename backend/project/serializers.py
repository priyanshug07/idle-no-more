from rest_framework import serializers
from .models import Project
from employee.models import Employee

class ProjectSerializer(serializers.ModelSerializer):
    employees = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all(), many=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'employees', 'statuses', 'priorities',
            'billable', 'deadline', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at'] 