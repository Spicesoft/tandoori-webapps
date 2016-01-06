define([
    "jquery",
    "underscore",
    "backbone",
    "moment",

    "./Base",
    "./List",
    "./RoomReservationEvent",
    "./DeskReservationEvent",
    "../util/overloadTemplate",

    "tpl!src/template/preview.ejs"
], function (
    $,
    _,
    Backbone,
    moment,

    BaseView,
    ListView,
    RoomReservationEventView,
    DeskReservationEventView,
    overloadTemplate,

    tplPreview
) {

    /* global Tandoori, alert_define */

    // check if template if overloaded in html
    tplPreview = overloadTemplate("preview", tplPreview);

    // contains a list of reservations and a validation button
    // displays a placeholder when the collection is empty
    var ReservationPreview = BaseView.extend({
        tpl: tplPreview,
        events: {
            // child events
            "click  .js-reservation-event-delete": "onDeleteClicked",
            // preview events
            "submit .js-reservations-form": "onSubmit",
            "change .js-reservations-validate-checkbox": "onCheckboxChange",

            "click .js-reservations-buy-btn": "onBuyClicked"
        },
        initialize: function (options) {
            ReservationPreview.__super__.initialize.apply(this, arguments);

            this.model = new Backbone.Model({
                price: 0,
                checked: false,
                loading: false,
                hasNegativeCredits: false // should be in an external model
            });

            this.rooms = options.rooms;
            this.desks = options.desks;
            this.credits = options.credits;


            this.roomList = new ListView({
                className: "preview-list",
                collection: this.rooms,
                getItemView: function (item) {
                    return new RoomReservationEventView({
                        model: item
                    });
                }
            });
            this.deskList = new ListView({
                className: "preview-list",
                collection: this.desks,
                getItemView: function (item) {
                    return new DeskReservationEventView({
                        model: item
                    });
                }
            });

            this.rooms.on("add", this.onReservationsChange, this);
            this.rooms.on("remove", this.onReservationsChange, this);
            this.desks.on("add", this.onReservationsChange, this);
            this.desks.on("remove", this.onReservationsChange, this);
            this.model.on("change", this.onModelChange, this);
            this.credits.on("change", this.checkNegativeCredits, this);

        },
        render: function () {
            // render template, prepend child lists
            ReservationPreview.__super__.render.apply(this, arguments);
            this.$(".js-reservations-total").autoNumeric("init", {aSep: " ", aDec: ",", aSign: " €", pSign: "s", wEmpty: "zero"});

            this.roomList.render();
            this.deskList.render();

            this.$el.prepend(this.roomList.$el);
            this.$el.prepend(this.deskList.$el);

            // first update
            this.onReservationsChange();
            this.onModelChange();

            return this;
        },

        checkNegativeCredits: function () {
            var negative = false;
            this.credits.each(function (c) {
                if (c.get("value") < 0) {
                    negative = true;
                }
            });
            this.model.set("hasNegativeCredits", negative);
        },
        setLoading: function (loading) {
            this.model.set("loading", loading);
        },
        // TODO: move this to App controller
        batchSave: function () {
            var all = [].concat(this.desks.models).concat(this.rooms.models);
            var data = all.map(function (reservation) {
                var json = reservation.toMinimalJSON();
                // add the TZ info
                json.from_date = moment(json.from_date).local().format();
                json.to_date = moment(json.to_date).local().format();
                return json;
            });

            var self = this;
            this.setLoading(true);

            $.ajax({
                method: "POST",
                url: Tandoori.urls.done,
                contentType: "application/json",
                data: JSON.stringify(data)
            })
            // check which reservation has failed and which has successed
            .then(function (responses, textStatus, jqXHR) {
                self.setLoading(false);
                // if we have detailed responses
                if (_.isArray(responses)) {
                    self.handleErrors(all, responses);
                } else if (Tandoori.reservation.data.offline) {
                    window.location = Tandoori.urls.signup;
                } else {
                    console.warn("Didn't receive multiple responses");
                }
            },
            // global failure
            function (jqXHR, textStatus, errorThrown) {
                self.setLoading(false);
                var responses = jqXHR.responseJSON;
                // if we have detailed responses
                if (_.isArray(responses)) {
                    self.handleErrors(all, responses);
                }
                else {
                    alert(errorThrown);
                }
            });
        },
        handleErrors: function (models, responses) {
            var errorsToDisplay = [];
            _.each(responses, function (response, index) {
                models[index].set("success", response.success);
                if (!response.success) {
                    models[index].set("errors", response.errors);
                    _.each(response.errors, function (error) {
                        if (error.client_display_error) {
                            errorsToDisplay.push(error.error);
                        }
                        else {
                            errorsToDisplay.push(gettext("Une erreur technique est survenue."));
                        }
                    });
                }
            });
            if (errorsToDisplay.length > 0) {
                var msg = errorsToDisplay.join("<br />");
                msg += '<br/><a class="btn btn-primary" href="javascript:location.reload()">' + gettext("Recharger la page") + "</a>";
                alert_define("danger", msg);
            }
            else {
                alert_define("info",
                    gettext("Réservations enregistrées.") +
                    '<br/><a class="btn btn-primary" href="' + Tandoori.urls.calendar + '">' +
                    gettext("Aller à l'agenda") +
                    "</a>"
                );
            }
        },
        updateTotal: function () {
            var self = this;
            var data = {
                items: []
            };
            this.desks.each(function (desk) {
                data.items.push({
                    quantity: 1,
                    unit: desk.get("unit"),
                    service_type: desk.get("service_type")
                });
            });
            this.rooms.each(function (room) {
                data.items.push({
                    quantity: 1,
                    unit: room.get("unit"),
                    service_type: room.get("service_type")
                });
            });

            $.ajax({
                method: "POST",
                url: Tandoori.urls.price,
                contentType: "application/json",
                data: JSON.stringify(data)
            })
            .then(function (response, textStatus, jqXHR) {
                if (response.price) {
                    self.model.set("price", response.price);
                }
            },
            // global failure
            function (jqXHR, textStatus, errorThrown) {
                console.warn(errorThrown);
            });
        },

        onModelChange: function () {
            // update submit button
            // always enabled when offline
            var buttonEnabled = Tandoori.reservation.data.offline || (this.model.get("checked") && !this.model.get("hasNegativeCredits"));
            this.$(".js-reservations-validate-btn").prop("disabled", !buttonEnabled);

            // set total price
            var total = this.model.get("price");
            this.$(".js-reservations-total").autoNumeric("set", total);

            // show/hide elements
            var buyButtonVisible = !Tandoori.reservation.data.offline && this.model.get("hasNegativeCredits");
            this.$(".js-reservations-buy-btn").toggle(buyButtonVisible);

            // loader
            var loading = this.model.get("loading");
            this.$el.toggleClass("loading", loading);
        },
        onReservationsChange: function () {
            if (this.rooms.length + this.desks.length > 0) {
                this.$(".js-reservations-placeholder").hide();
                this.$(".js-reservations-form").show();
            }
            else {
                this.$(".js-reservations-placeholder").show();
                this.$(".js-reservations-form").hide();
            }
            // fetch new price
            if (Tandoori.reservation.data.offline) {
                this.updateTotal();
            }
        },
        onSubmit: function (ev) {
            ev.preventDefault();
            this.trigger("save");
            this.batchSave();
        },
        onDeleteClicked: function (ev) {
            var model = this.deskList.modelFromEl(ev.currentTarget);
            if (!model) {
                model = this.roomList.modelFromEl(ev.currentTarget);
            }
            model.destroy();
        },
        onCheckboxChange: function () {
            var checked = this.$(".js-reservations-validate-checkbox").is(":checked");
            this.model.set("checked", checked);
        },
        onBuyClicked: function () {
            this.trigger("buy-clicked");
        }
    });

    return ReservationPreview;
});
