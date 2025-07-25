from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Project
from .serializers import ProjectSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from internals.permissions.permissions import IsAdminEmployee, IsSuperUser
from employee.models import Employee

# Create your views here.

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminEmployee]

    def get_queryset(self):
        """
        Filter projects by the authenticated user's organisation.
        """
        return Project.objects.filter(employees__organisation=self.request.user.organisation).distinct()

    @action(detail=True, methods=['post'])
    def assign_employees(self, request, pk=None):
        """
        Assign employees to an existing project.
        Admin can only assign employees from their own organisation.
        Return 400 if any employee is already assigned.
        """
        project = self.get_object()
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
            already_assigned = set(project.employees.values_list('id', flat=True)) & found_employee_ids
            if already_assigned:
                return Response({
                    'detail': f'Employees with IDs {already_assigned} are already assigned to this project.'
                }, status=status.HTTP_400_BAD_REQUEST)
            if project.employees.filter(organisation=admin_organisation).exists():
                project.employees.add(*employees)
                return Response({
                    'detail': f'Successfully assigned {len(employees)} employees to project'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'detail': 'You can only assign employees to projects in your organisation.'
                }, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
