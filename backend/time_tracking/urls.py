from django.urls import path
from .views import StartTimeTrackingView, ActiveTimeTrackingView, EndTimeTrackingView, ListTimeTrackingsView

urlpatterns = [
    path('start/', StartTimeTrackingView.as_view(), name='start-time-tracking'),
    path('active/', ActiveTimeTrackingView.as_view(), name='active-time-tracking'),
    path('end/<int:time_tracking_id>/', EndTimeTrackingView.as_view(), name='end-time-tracking'),
    path('list/', ListTimeTrackingsView.as_view(), name='list-time-trackings'),
] 