from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Employee
from .serializers import EmployeeSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from internals.permissions.permissions import IsAdminEmployee, IsSuperUser
from internals.redis_client import get_key, set_key
from django.contrib.auth.hashers import make_password
from django.utils import timezone
import base64
import urllib.parse
import random
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken



class EmployeeCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminEmployee]

    def post(self, request, *args, **kwargs):
        serializer = EmployeeSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save(organisation=request.user.organisation)
            signup_url = self.generate_user_signup_link(user.id)
            return Response({
                'user': serializer.data,
                'signup_url': signup_url
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def generate_user_signup_link(self, user_id):
        code = random.randint(100000, 999999)
        set_key(code, user_id)
        params = {
            'code': code,
        }
        # Build the URL with encoded parameters
        query_string = urllib.parse.urlencode(params)
        signup_url = f"/api/employees/activate-account/?{query_string}"
        return signup_url

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

class ValidateCodeView(APIView):
    def get(self, request, *args, **kwargs):
        code = request.query_params.get('code')
        if not code:
            return Response({'valid': False, 'detail': 'Code is required.'}, status=400)
        user_id = get_key(code)
        if user_id:
            try:
                user = Employee.objects.get(id=user_id)
            except Employee.DoesNotExist:
                return Response({'valid': False, 'detail': 'User not found.'}, status=404)
            refresh = RefreshToken.for_user(user)
            return Response({
                'valid': True,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_id': user.id,
                'username': user.username,
                'email': user.email
            })
        return Response({'valid': False, 'detail': 'Invalid or expired code.'}, status=400)

class ActivateAccountView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        password = request.data.get('password')
        if not password:
            return Response({'detail': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        user.set_password(password)
        user.is_active = True
        user.activated_at = timezone.now()
        user.save()
        return Response({'detail': 'Account activated successfully.'}, status=status.HTTP_200_OK)
