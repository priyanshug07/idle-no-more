from django.urls import path
from .views import EmployeeCreateView, AdminCreateView

urlpatterns = [
    path('employees/', EmployeeCreateView.as_view(), name='employee-create'),
    path('employees/add-admin/', AdminCreateView.as_view(), name='admin-create'),
] 