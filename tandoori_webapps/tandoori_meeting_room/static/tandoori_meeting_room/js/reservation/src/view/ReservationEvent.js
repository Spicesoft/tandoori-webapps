define([
    "./Base"
], function (
    BaseView
) {
    var ReservationEvent = BaseView.extend({
        className: "reservation-event-preview panel-body",
        renderOnChange: true
    });

    return ReservationEvent;
});
