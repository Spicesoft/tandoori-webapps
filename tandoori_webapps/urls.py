# -*- coding: utf-8 -*-
"""Tandoori Webapps url conf."""
from django.conf.urls import include, url

from . import views


urlpatterns = [
    url(r"^$", views.WebappsTemplateView.as_view(),
        name="webapp_index"),
    url(r"^login/$", views.WebappsLoginView.as_view(),
        name="webapp_login"),
    url(r"^meeting_room/",
        include("tandoori_webapps.tandoori_meeting_room.urls")),
    url(r"^concierge/",
        include("tandoori_webapps.tandoori_concierge.urls")),
]
