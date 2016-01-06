define([
    "./List",
    "./Credit"
], function (
    ListView,
    CreditView
) {
    var Credits = ListView.extend({
        className: "reservation-available-credits",
        getItemView: function (item) {
            return new CreditView({
                model: item
            });
        }
    });

    return Credits;
});
