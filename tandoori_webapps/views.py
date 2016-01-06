# -*- coding: utf-8 -*-
"""Tandoori_webapps views."""

from django.utils.translation import ugettext_lazy as _
from django.utils.html import format_html

from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm

from authtools import views

from . import models


class WebappsMixin(object):

    def get_context_data(self, **kwargs):
        context = super(WebappsMixin, self).get_context_data()
        context.update({
            "webapps": models.App.objects.all(),
        })
        return context


class WebappsTemplateView(WebappsMixin, views.TemplateView):

    """Default view."""

    template_name = "tandoori_webapps/index.html"


class WebappsLoginView(views.LoginView):

    """Subclass of authtools LoginView."""

    form_class = AuthenticationForm
    template_name = "tandoori_webapps/connection.html"

    def get_form(self, form_class):
        """Return an instance of the form to be used with this view."""
        return form_class(self.request, **self.get_form_kwargs())

    # def form_valid(self, form):
    #     """Set user language."""
    #     response = super(WebappsLoginView, self).form_valid(form)
    #     lib_tools.set_current_language(self.request)
    #     return response
    #
    def form_invalid(self, form):
        """Check if user is confirmed or not."""
        if not hasattr(form, "user_cache"):
            return super(WebappsLoginView, self).form_invalid(form)

        if form.user_cache and not form.user_cache.is_confirmed:
            msg = format_html(_(
                u"Votre email {} n'a toujours pas été vérifié. "
                u"Cliquez <a class='alert-link' href='#'>ici</a> pour "
                u"renvoyer un email"
            ), form.cleaned_data["username"])
            messages.add_message(self.request, messages.ERROR, msg)
        return super(WebappsLoginView, self).form_invalid(form)
