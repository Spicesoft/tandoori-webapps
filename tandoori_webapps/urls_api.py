# -*- coding: utf-8 -*-
"""Tandoori Webapps api url conf."""
from django.conf.urls import include, url


urlpatterns = [
    url(r"^concierge/",
        include("tandoori_webapps.tandoori_concierge.urls_api")),
]
