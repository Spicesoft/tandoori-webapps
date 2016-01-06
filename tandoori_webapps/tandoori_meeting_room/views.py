"""Tandoori_concierge views."""
from django.conf import settings

from django.views import generic

import json

from tandoori_publication import models as pub_models
from tandoori_units import constants as unit_constants
from django.contrib.auth.forms import AuthenticationForm

from tandoori_webapps.views import WebappsMixin


class MeetingRoomListView(WebappsMixin, generic.ListView):

    model = pub_models.MeetingRoom
    template_name = "tandoori_meeting_room/index.html"


class MeetingRoomDetailView(WebappsMixin, generic.DetailView):

    """Default view."""

    model = pub_models.MeetingRoom
    raise_exception = True
    template_name = "tandoori_meeting_room/meeting_room.html"

    def get_context_data(self, **kwargs):
        """Add center with its meeting rooms to context."""
        context = super(MeetingRoomDetailView, self).get_context_data()
        centers_data = []
        order = ["hh", "h", "hd", "d", "w", "m"]
        order.extend(unit_id for unit_id in unit_constants.UNITS
                     if unit_id not in order)
        desk_service_type = pub_models.ServiceType.objects.filter(
            category="desk").first()
        room_service_type = pub_models.ServiceType.objects.filter(
            category="meeting_room").first()
        for c in pub_models.Center.objects.all():
            product = pub_models.Product.objects.find(
                desk_service_type, center=c)
            desk_base_product_id = product.id if product else -1

            product = pub_models.Product.objects.find(
                room_service_type, center=c)
            room_base_product_id = product.id if product else -1

            half_day_periods = []
            for ((start, end), name) in settings.HALF_DAY_PERIODS:
                half_day_periods.append({
                    "start_time": str(start),
                    "end_time": str(end)
                })

            data = {
                "pk": c.pk,
                "name": c.service.name,
                "desk_service_type": desk_service_type.id,
                "desk_base_product": desk_base_product_id,
                "room_service_type": room_service_type.id,
                "room_base_product": room_base_product_id,
                "opening_hours": [],
                "half_day_periods": half_day_periods,
                "rooms": [],
                "nb_desks": pub_models.Desk.objects.all().count(),
            }
            centers_data.append(data)
            for oh in c.openinghours_set.all():
                data["opening_hours"].append({
                    "day": oh.day,
                    "opening_time": str(oh.opening_time),
                    "closing_time": str(oh.closing_time)
                })

            data["rooms"] = list(c.service.get_descendants().filter(
                meetingroom__isnull=False).values("pk", "name"))

        credits_data = {}
        if self.request.user.is_authenticated():
            qs = self.request.user.account.credit_set.valid_credits()
            credits_ = qs.group_by_service_type_category()

            for c in credits_:
                credits_data[c["service_type__category"]] = c["value"]

        context.update({
            "centers": pub_models.Center.objects.all(),
            "centers_json": json.dumps(centers_data),
            "credits_json": json.dumps({}),
            "form": AuthenticationForm()
        })
        return context
