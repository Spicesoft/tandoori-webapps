define([
    "./ReservationEvent",
    "../util/overloadTemplate",

    "tpl!src/template/deskEvent.ejs"
], function (
    ReservationEventView,
    overloadTemplate,

    tplDeskEvent
) {
    // check if template if overloaded in html
    tplDeskEvent = overloadTemplate("deskEvent", tplDeskEvent);

    var DeskReservationEvent = ReservationEventView.extend({
        tpl: tplDeskEvent
    });

    return DeskReservationEvent;
});
