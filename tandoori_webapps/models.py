# coding: utf-8
"""Tandoori webapps models."""
from django.db import models
from django_extensions.db.models import TimeStampedModel, AutoSlugField
from django.utils.encoding import python_2_unicode_compatible
from django.utils.translation import ugettext_lazy as _

from tandoori_tenant import models as tenant_models


@python_2_unicode_compatible
class App(models.Model):

    """A model to represent an app."""

    name = models.CharField(
        _(u"Nom de l'application"), max_length=200, null=False, default="")
    slug = AutoSlugField(_(u"Application slug"), populate_from="name")
    description = models.CharField(
        _(u"Description de l'application"), max_length=200, default="")
    version_name = models.CharField(
        _(u"Nom de version de l'application"), max_length=200, null=False,
        default="")
    version_code = models.IntegerField(
        _(u"Code de version de l'application"), default=0)

    apk_call = models.CharField(
        _(u"Appel de l'application"), max_length=200, null=True)

    class Meta:
        permissions = (("can_use_tablet", "Can view tablet apps"),)

    def __str__(self):
        return u"{} version {}".format(
            self.name, self.version_name
        )


class AppSubscription(TimeStampedModel):

    """A model to represent an app subscription."""

    tenant = models.ForeignKey(tenant_models.Tenant)
    app = models.ForeignKey(App)
    from_date = models.DateTimeField(_(u"date de début"))
    to_date = models.DateTimeField(_(u"date de fin"))
