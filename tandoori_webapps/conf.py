# flake8: noqa
"""
Webapp settings.

Declare App model as public.
"""


class WebappsConf(object):

    """Only for the brave...euh...dev."""

    @property
    def SHARED_APPS(self):
        """Add djangobower to SHARED_APPS."""
        return super(WebappsConf, self).SHARED_APPS + (
            "tandoori_webapps",
            "tandoori_webapps.tandoori_meeting_room",
            "tandoori_webapps.tandoori_concierge",
        )
