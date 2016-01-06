define([
    "./ReservationEvent",
    "../util/overloadTemplate",

    "tpl!src/template/roomEvent.ejs"
], function (
    ReservationEventView,
    overloadTemplate,

    tplRoomEvent
) {
    // check if template if overloaded in html
    tplRoomEvent = overloadTemplate("roomEvent", tplRoomEvent);

    var RoomReservationEvent = ReservationEventView.extend({
        tpl: tplRoomEvent
    });

    return RoomReservationEvent;
});
