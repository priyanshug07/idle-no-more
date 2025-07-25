from rest_framework import serializers
from .models import Task
from employee.models import Employee

class TaskSerializer(serializers.ModelSerializer):
    employees = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all(), many=True)

    class Meta:
        model = Task
        fields = [
            'id', 'name', 'description', 'employees', 'project', 'deadline',
            'status', 'labels', 'priority', 'billable', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Validate that employees assigned to the task belong to the same project.
        """
        project = data.get('project')
        employees = data.get('employees', [])
        
        if project and employees:
            for employee in employees:
                if project not in employee.projects.all():
                    raise serializers.ValidationError(
                        f"Employee {employee.username} is not assigned to project {project.name}. "
                        "Employees must be assigned to the project before being assigned to its tasks."
                    )
        
        return data 