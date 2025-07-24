from django.urls import path
from .views import EmployeeCreateView, AdminCreateView, ActivateAccountView, ValidateCodeView

urlpatterns = [
    path('employees/', EmployeeCreateView.as_view(), name='employee-create'),
    path('employees/add-admin/', AdminCreateView.as_view(), name='admin-create'),
    path('employees/activate-account/', ActivateAccountView.as_view(), name='activate-account'),
    path('employees/validate-code/', ValidateCodeView.as_view(), name='validate-code'),
] 