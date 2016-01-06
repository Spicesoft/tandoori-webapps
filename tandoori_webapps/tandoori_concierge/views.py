"""Tandoori concierge views."""

from django import http
from django.conf import settings
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _
from django.views.generic import ListView

import rest_framework
import twilio

from tandoori_account import models as account_models
from tandoori_webapps.views import WebappsMixin


class ConciergeListView(WebappsMixin, ListView):

    """Default view."""

    model = account_models.Account
    raise_exception = True
    template_name = "tandoori_concierge/index.html"

    def get_context_data(self, **kwargs):
        context = super(ConciergeListView, self).get_context_data()

        # twilio_account_sid = "AC1fc86dd10cc4eb3214394b102bc6301c"
        # twilio_auth_token = "3f705783193d8207c2e80dcfe2f7d7e4"

        capability = twilio.util.TwilioCapability(
            self.request.tenant.twilio_account_sid,
            self.request.tenant.twilio_auth_token)
        capability.allow_client_outgoing("AP3d5f5345419fece5f59e8427218672e4")
        context.update({"capacity": capability.generate(expires=600)})
        return context


class TwillioSMSAPIView(rest_framework.generics.GenericAPIView):

    """SMS API view."""

    authentication_classes = (
        rest_framework.authentication.SessionAuthentication, )
    permission_classes = (rest_framework.permissions.IsAuthenticated, )

    def get(self, request, *args, **kwargs):
        """Return list method."""
        request.tenant.twilio_client.messages.create(
            body="Quelqu'un vous attend en bas du centre.",
            from_="+33644600163",
            to="+33675868719"
        )
        return http.JsonResponse({})


class TwillioCallAPIView(rest_framework.generics.GenericAPIView):

    """Twillio Call API View."""

    authentication_classes = (
        rest_framework.authentication.SessionAuthentication, )
    permission_classes = (rest_framework.permissions.IsAuthenticated, )

    def get(self, request, *args, **kwargs):
        """Return list method."""
        settings.twilio_account_sid = "AC1fc86dd10cc4eb3214394b102bc6301c"
        settings.TWILIO_AUTH_TOKEN = "3f705783193d8207c2e80dcfe2f7d7e4"

        request.tenant.twilio_client.calls.create(
            from_="+33644600163",
            to="+33675868719",
            url=reverse("concierge_call")
        )

        return http.JsonResponse({
            "message": _("Thank you! We will be calling you shortly.")
        })


class TwillioRespondAPIView(rest_framework.generics.GenericAPIView):

    """Twillio Respond API View."""

    authentication_classes = ()
    permission_classes = (rest_framework.permissions.AllowAny, )

    def get(self, request, *args, **kwargs):
        """Return list method."""
        response = twilio.twiml.Response()
        response.addDial("+33675868719", callerId="+33644600163")
        return http.HttpResponse(str(response), content_type="text/xml")
