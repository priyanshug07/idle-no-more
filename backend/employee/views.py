from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Employee
from .serializers import EmployeeSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from internals.permissions.permissions import IsAdminEmployee, IsSuperUser



class EmployeeCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminEmployee]

    def post(self, request, *args, **kwargs):
        serializer = EmployeeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(organisation=request.user.organisation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsSuperUser]

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        data['role'] = 'admin'

        if 'organisation' not in data:
            return Response({'detail': 'organisation field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = EmployeeSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
