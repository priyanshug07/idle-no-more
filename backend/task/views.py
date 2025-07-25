from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Task
from .serializers import TaskSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from internals.permissions.permissions import IsAdminEmployee, IsSuperUser
from employee.models import Employee

# Create your views here.

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminEmployee]

    def get_queryset(self):
        """
        Filter tasks by the authenticated user's organisation and optionally by project ID.
        """
        queryset = Task.objects.filter(project__employees__organisation=self.request.user.organisation).distinct()
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    @action(detail=True, methods=['post'])
    def assign_employees(self, request, pk=None):
        """
        Assign employees to an existing task.
        Admin can only assign employees from their own organisation.
        Return 400 if any employee is already assigned.
        """
        task = self.get_object()
        employee_ids = request.data.get('employee_ids', [])
        
        if not employee_ids:
            return Response({'detail': 'employee_ids is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        admin_organisation = request.user.organisation
        try:
            employees = Employee.objects.filter(
                id__in=employee_ids, 
                organisation=admin_organisation
            )
            found_employee_ids = set(employees.values_list('id', flat=True))
            requested_employee_ids = set(employee_ids)
            if found_employee_ids != requested_employee_ids:
                missing_ids = requested_employee_ids - found_employee_ids
                return Response({
                    'detail': f'Employees with IDs {missing_ids} do not belong to your organisation or do not exist.'
                }, status=status.HTTP_400_BAD_REQUEST)
            # Check for already assigned employees
            already_assigned = set(task.employees.values_list('id', flat=True)) & found_employee_ids
            if already_assigned:
                return Response({
                    'detail': f'Employees with IDs {already_assigned} are already assigned to this task.'
                }, status=status.HTTP_400_BAD_REQUEST)
            # Validate that employees belong to the same project
            for employee in employees:
                if task.project not in employee.projects.all():
                    return Response({
                        'detail': f'Employee {employee.username} is not assigned to project {task.project.name}. '
                                 'Employees must be assigned to the project before being assigned to its tasks.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            if task.project.employees.filter(organisation=admin_organisation).exists():
                task.employees.add(*employees)
                return Response({
                    'detail': f'Successfully assigned {len(employees)} employees to task'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'detail': 'You can only assign employees to tasks in projects from your organisation.'
                }, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
