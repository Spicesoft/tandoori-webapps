"""Tandoori concierge url conf."""
from django.conf.urls import url

from . import views


urlpatterns = [
    url(r"^$", views.ConciergeListView.as_view(), name="concierge_index")
]
