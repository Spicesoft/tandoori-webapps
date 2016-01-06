"""Tandoori webapps admin registration."""

from reversion.admin import VersionAdmin

from django.contrib import admin

from . import models


admin.site.register(models.App, VersionAdmin)
