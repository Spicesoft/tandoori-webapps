# coding: utf-8
"""Webapps template tags."""
import urllib

from django import template

register = template.Library()


@register.simple_tag(takes_context=True)
def app_href(context, url):
    host = "{scheme}%3A%2F%2F{tenant}".format(
        scheme=context.get("request").META["wsgi.url_scheme"],
        tenant=urllib.quote_plus(
            "{}{}".format(context.get("tenant").domain_url, ":8000")
        )
    )
    return url.format(host=host)
