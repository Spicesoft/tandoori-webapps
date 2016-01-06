define([
    "backbone",

    "../model/Reservation"
], function (
    Backbone,

    Reservation
) {
    var Reservations = Backbone.Collection.extend({
        model: Reservation,
        comparator: function (a, b) {
            // if there's a resource, sort by title first
            var aTitle = a.get("resource") && a.get("resource").title;
            var bTitle = b.get("resource") && b.get("resource").title;
            if (aTitle !== bTitle) {
                return aTitle.localeCompare(bTitle);
            }
            // then, sort by start date
            var aStart = a.get("from_date").toDate().getTime();
            var bStart = b.get("from_date").toDate().getTime();
            return aStart - bStart;
        }
    });

    return Reservations;
});
