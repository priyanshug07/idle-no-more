from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone as dj_timezone
from .models import TimeTracking
from task.models import Task
import pytz
from dateutil import parser
from datetime import datetime

# Create your views here.

class StartTimeTrackingView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        task_id = request.data.get('task_id')
        tz = request.data.get('timezone')
        description = request.data.get('description')
        mac = request.data.get('mac')
        ip = request.data.get('ip')
        device_details = request.data.get('device_details')

        if not task_id or not tz:
            return Response({'detail': 'task_id and timezone are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response({'detail': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Validate timezone
        try:
            user_tz = pytz.timezone(tz)
        except Exception:
            return Response({'detail': 'Invalid timezone.'}, status=status.HTTP_400_BAD_REQUEST)

        now_utc = dj_timezone.now().astimezone(pytz.UTC)

        time_entry = TimeTracking.objects.create(
            employee=user,
            task=task,
            start_time=now_utc,
            description=description,
            is_active=True,
            timezone=tz
        )
        time_entry.set_device_details(mac=mac, ip=ip, device_details=device_details)
        time_entry.save()
        return Response({'detail': 'Time tracking started.', 'id': time_entry.id}, status=status.HTTP_201_CREATED)

class ActiveTimeTrackingView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        active_entry = TimeTracking.objects.filter(employee=user, is_active=True).order_by('-start_time').first()
        if not active_entry:
            return Response({'detail': 'No active time tracking entry.'}, status=status.HTTP_404_NOT_FOUND)
        # Serialize the entry (simple dict for now)
        data = {
            'id': active_entry.id,
            'task_id': active_entry.task.id,
            'start_time': active_entry.start_time,
            'description': active_entry.description,
            'device_details': active_entry.device_details,
            'timezone': active_entry.timezone,
            'is_active': active_entry.is_active,
        }
        return Response(data, status=status.HTTP_200_OK)

class EndTimeTrackingView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, time_tracking_id, *args, **kwargs):
        user = request.user
        try:
            entry = TimeTracking.objects.get(id=time_tracking_id, employee=user, is_active=True)
        except TimeTracking.DoesNotExist:
            return Response({'detail': 'Active time tracking entry not found for this user.'}, status=status.HTTP_404_NOT_FOUND)
        entry.end_time = dj_timezone.now()
        entry.is_active = False
        entry.save()
        return Response({'detail': 'Time tracking ended.', 'id': entry.id, 'end_time': entry.end_time}, status=status.HTTP_200_OK)

class ListTimeTrackingsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        qs = TimeTracking.objects.filter(employee=user)
        from_time = request.query_params.get('from_time')
        to_time = request.query_params.get('to_time')
        task_id = request.query_params.get('task_id')
        project_id = request.query_params.get('project_id')

        # Expected format: "YYYY-MM-DD HH:mm:ss±HH:mm" or "YYYY-MM-DD HH:mm:ss"
        datetime_format = "%Y-%m-%d %H:%M:%S"
        
        if from_time:
            try:
                # Try parsing as timezone aware string first
                try:
                    from_time_parsed = parser.parse(from_time)
                    if from_time_parsed.tzinfo:
                        from_time_utc = from_time_parsed.astimezone(pytz.UTC)
                    else:
                        raise ValueError("No timezone info")
                except:
                    # If no timezone info, parse as naive datetime and convert to UTC
                    from_time_parsed = datetime.strptime(from_time, datetime_format)
                    from_time_utc = pytz.UTC.localize(from_time_parsed)
                
                qs = qs.filter(start_time__gte=from_time_utc)
            except ValueError:
                return Response({
                    'detail': f'Invalid from_time format. Expected format: {datetime_format} or {datetime_format}±HH:mm'
                }, status=status.HTTP_400_BAD_REQUEST)

        if to_time:
            try:
                # Try parsing as timezone aware string first
                try:
                    to_time_parsed = parser.parse(to_time)
                    if to_time_parsed.tzinfo:
                        to_time_utc = to_time_parsed.astimezone(pytz.UTC)
                    else:
                        raise ValueError("No timezone info")
                except:
                    # If no timezone info, parse as naive datetime and convert to UTC
                    to_time_parsed = datetime.strptime(to_time, datetime_format)
                    to_time_utc = pytz.UTC.localize(to_time_parsed)

                qs = qs.filter(end_time__lte=to_time_utc)
            except ValueError:
                return Response({
                    'detail': f'Invalid to_time format. Expected format: {datetime_format} or {datetime_format}±HH:mm'
                }, status=status.HTTP_400_BAD_REQUEST)
        if task_id:
            qs = qs.filter(task_id=task_id)
        if project_id:
            task_ids = user.tasks.filter(project_id=project_id).values_list('id', flat=True)
            qs = qs.filter(task_id__in=task_ids)

        data = []
        for entry in qs.order_by('-start_time'):
            entry_tz = entry.timezone or 'UTC'
            try:
                entry_user_tz = pytz.timezone(entry_tz)
            except Exception:
                entry_user_tz = pytz.UTC
            start_time_user = entry.start_time.astimezone(entry_user_tz) if entry.start_time else None
            end_time_user = entry.end_time.astimezone(entry_user_tz) if entry.end_time else None
            data.append({
                'id': entry.id,
                'task_id': entry.task.id,
                'project_id': entry.task.project.id,
                'start_time': entry.start_time,
                'end_time': entry.end_time,
                'start_time_user_time_zone': start_time_user,
                'end_time_user_time_zone': end_time_user,
                'description': entry.description,
                'device_details': entry.device_details,
                'timezone': entry.timezone,
                'is_active': entry.is_active,
            })
        return Response(data, status=status.HTTP_200_OK)
