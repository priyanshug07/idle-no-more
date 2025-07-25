from django.urls import path
from .views import (
    EmployeeCreateView, AdminCreateView, ActivateAccountView, ValidateCodeView,
    DeactivateEmployeeView, CurrentEmployeeView, UserProjectsView, UserTasksView
)

urlpatterns = [
    path('employees/', EmployeeCreateView.as_view(), name='employee-create'),
    path('employees/add-admin/', AdminCreateView.as_view(), name='admin-create'),
    path('employees/activate-account/', ActivateAccountView.as_view(), name='activate-account'),
    path('employees/validate-code/', ValidateCodeView.as_view(), name='validate-code'),
    path('employees/deactivate/', DeactivateEmployeeView.as_view(), name='employee-deactivate'),
    path('employees/me/', CurrentEmployeeView.as_view(), name='employee-me'),
    path('employees/me/projects/', UserProjectsView.as_view(), name='employee-projects'),
    path('employees/me/tasks/', UserTasksView.as_view(), name='employee-tasks'),
] 