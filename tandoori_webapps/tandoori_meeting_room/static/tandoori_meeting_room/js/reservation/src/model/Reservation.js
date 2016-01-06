define([
    "jquery",
    "underscore",
    "backbone",
    "moment"
], function (
    $,
    _,
    Backbone,
    moment
) {
    /* global Tandoori */
    // Reservation does 2 things: represent a reservation & the associated fullcalendar event
    var Reservation = Backbone.Model.extend({
        defaults: {
            // client props
            type: "", // used to determine the correct unit
            title: gettext("Votre réservation"), // shown in the calendar
            color: "", // shown in the calendar
            resource: null, // use to determine the service and shown in the timeline & preview
            count: 0,
            startCount: 0,
            number: 0,

            // server props
            from_date: null,
            to_date: null,
            center: Tandoori.reservation.data.centers[0].pk,
            account: Tandoori.reservation.data.account_id,
            service_type: null,
            service: "",
            unit: "",

            // errors
            success: null,
            errors: null
        },
        // converts to fullcalendar event configuration
        getFullCalendarEvent: function () {
            var ev = _.pick(this.attributes,
                "allDay", "count", "number",
                "title", "color", "textColor",
                "backgroundColor", "borderColor"
            );
            return _.extend(ev, {
                id: this.id || this.cid,
                start: moment(this.get("from_date")),
                end: moment(this.get("to_date")),
                resourceId: this.get("resource") ? this.get("resource").id : null
            });
        },
        toMinimalJSON: function () {
            return {
                service_type: this.get("service_type"),
                from_date: this.get("from_date"),
                to_date: this.get("to_date"),
                center: this.get("center"),
                account: this.get("account"),
                service: this.get("service"),
                unit: this.get("unit")
            };
        }
    });

    /*
     * Create a Reservation from fullcal event, type & resource
     */
    Reservation.create = function (event, type, resource) {
        var r = _.pick(event,
            "title", "color", "textColor",
            "backgroundColor", "borderColor",
            "allDay", "count", "number"
        );

        _.extend(r, {
            type: type,
            resource: resource,
            startCount: event.count,

            from_date: moment(event.start),
            to_date: moment(event.end), // TODO: check if !=
            service_type: resource ? null : Tandoori.reservation.data.centers[0].desk_service_type,
            service: resource ? resource.id : null
        });

        switch (type) {
            case "desk-pm":
            case "desk-am":
                r.unit = "hd";
                break;
            case "desk-day":
                r.unit = "d";
                break;
            case "desk-month":
                r.unit = "m";
                break;
            case "meeting_room":
                r.unit = "hh";
                break;
            default:;
        }
        return new Reservation(r);
    };

    return Reservation;
});
