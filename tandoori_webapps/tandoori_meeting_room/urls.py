"""Tandoori concierge url conf."""
from django.conf.urls import url

from . import views


urlpatterns = [
    url(r"^(?P<pk>\d+)/$", views.MeetingRoomDetailView.as_view(),
        name="meeting_room_detail"),
    url(r"^$", views.MeetingRoomListView.as_view(),
        name="meeting_room_index"),
]
