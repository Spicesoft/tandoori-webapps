"""Tandoori concierge api url conf."""
from django.conf.urls import url

from . import views


urlpatterns = [
    url(r"^call/$", views.TwillioCallAPIView.as_view(), name="concierge_call"),
    url(r"^sms/$", views.TwillioSMSAPIView.as_view(), name="concierge_sms"),
    url(r"^respond/$", views.TwillioRespondAPIView.as_view(),
        name="concierge_respond")
]
