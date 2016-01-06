define([
    "underscore",
    "jquery",
    "backbone",
    "moment",

    "./model/Credit",
    "./model/Reservation",
    "./collection/Credits",
    "./collection/Reservations",
    "./collection/Menu",
    "./view/ReservationPreview",
    "./view/Credits",
    "./view/Menu",
    "./util/momentTime",
    "./util/batchCalendar"
], function (
    _,
    $,
    Backbone,
    moment,
    // models
    Credit,
    Reservation,
    // collections
    Credits,
    Reservations,
    Menu,
    // views
    ReservationPreview,
    CreditsView,
    MenuView,
    // utils
    momentTime,
    batchCalendar
  ) {

    /* global Tandoori */

    // prepare server data (from global Tandoori variable)

    var resources = _.map(Tandoori.reservation.data.centers, function (center) {
        return {
            id: center.pk,
            title: center.name,
            children: _.map(center.rooms, function (room) {
                return {
                    id: room.pk,
                    title: room.name
                };
            })
        };
    });

    var openingTimes = [];
    var closingTimes = [];

    _.each(Tandoori.reservation.data.centers, function (center) {
        _.each(center.opening_hours, function (oh) {
            openingTimes.push(oh.opening_time);
            closingTimes.push(oh.closing_time);
        });
    });
    // earliest/latest
    var opening, closing;
    // convert to datetime (today + provided time)
    // sort, take first or last
    openingTimes = _.map(openingTimes, function (time) {
        return momentTime(moment(), time);
    });
    openingTimes.sort();
    closingTimes = _.map(closingTimes, function (time) {
        return momentTime(moment(), time);
    });
    closingTimes.sort();

    opening = openingTimes[0];
    closing = closingTimes[closingTimes.length - 1];

    var openingTimeStr = opening.format("HH:mm");
    var closingTimeStr = closing.format("HH:mm");



    // some utils functions
    // TODO: move to separate file

    // checks if an event overlaps with any other
    function overlaps(event, events) {
        var overlapEvent = _.some(events, function (ev) {
            // use != instead of !== to have null == undefined
            /* eslint-disable eqeqeq */
            if (event.resourceId != ev.resourceId) {
                return false;
            }
            /* eslint-enable eqeqeq */
            return event.start < ev.end && event.end > ev.start;
        });
        return Boolean(overlapEvent);
    }



    // if an event spans from one day to another, split it in multiple days
    // (respecting opening_hours)
    function splitRoomEvent(event) {
        var events = [];

        var start = moment(event.start);
        var end = momentTime(event.start, closingTimeStr);

        while (!start.isSame(event.end, "day")) {
            events.push(_.extend({}, event, {
                start: start,
                end: end
            }));
            start = momentTime(start, openingTimeStr).add(1, "day");
            end = moment(end).add(1, "day");
        }
        events.push(_.extend({}, event, {
            start: start,
            end: event.end
        }));

        return events;
    }
    // if an event spans multiple days, split it
    // this case is simple, we keep the same times
    // (ex: a PM reservation on 3 days => 3 PM reservations)
    function splitDeskEvent(event) {
        // special case: month reservation are not splitted
        if (event.type === "desk-month") {
            return [event];
        }
        var events = [];

        var start = moment(event.start);
        var end = momentTime(event.start, event.end.format("HH:mm"));

        while (!start.isSame(event.end, "day")) {
            events.push(_.extend({}, event, {
                start: start,
                end: end
            }));
            start = moment(start).add(1, "day");
            end = moment(end).add(1, "day");
        }
        events.push(_.extend({}, event, {
            start: start,
            end: event.end
        }));

        return events;
    }



    function completeDeskEvents(from, to, events) {
        var all = [];
        var half_day_periods = Tandoori.reservation.data.centers[0].half_day_periods;
        var center_data = Tandoori.reservation.data.centers[0];

        // from cannot be < today
        var today = moment().utc().startOf("day");
        if (from < today) {
            from = today;
        }
        // generate all days between from and to
        var days = [];
        var datetime = moment(from);
        while (datetime < to) {
            days.push(moment(datetime));
            datetime.add(1, "day");
        }

        function findEvent(day) {
            return _.find(events, function (ev) {
                return moment(ev.start).isSame(day, "day");
            });
        }

        /*
         * for each day, split the provided event into 2 events (AM + PM)
         * or create 2 events from scratch
         */
        for (var i = 0; i < days.length; i++) {
            var day = days[i];
            var event = findEvent(day);
            if (event) {
                all.push({
                    allDay: true,
                    count: event.am_count,
                    number: event.number || center_data.nb_desks || 0,
                    service_type: event.service_type,
                    start: momentTime(day, half_day_periods[0].start_time),
                    end: momentTime(day, half_day_periods[0].end_time)
                }, {
                    allDay: true,
                    count: event.pm_count,
                    number: event.number || center_data.nb_desks || 0,
                    service_type: event.service_type,
                    start: momentTime(day, half_day_periods[1].start_time),
                    end: momentTime(day, half_day_periods[1].end_time)
                });
            }
            else {
                all.push({
                    allDay: true,
                    count: 0,
                    number: center_data.nb_desks || 0,
                    service_type: center_data.desk_service_type,
                    start: momentTime(day, half_day_periods[0].start_time),
                    end: momentTime(day, half_day_periods[0].end_time)
                }, {
                    allDay: true,
                    count: 0,
                    number: center_data.nb_desks || 0,
                    service_type: center_data.desk_service_type,
                    start: momentTime(day, half_day_periods[1].start_time),
                    end: momentTime(day, half_day_periods[1].end_time)
                });
            }
        }
        return all;
    }




    /***************
     * Application *
     ***************/

    function App() {
        this.views = {};
        this.createDataStructures();
        this.createViews();
        // setupCalendars() is called after render
    }

    _.extend(App.prototype, Backbone.Events, {

        createDataStructures: function () {
            var self = this;
            // existing reservations
            this.existingRoomReservations = new Reservations();
            this.existingDeskReservations = new Reservations();
            this.deskAvailabilityFakeReservations = new Reservations();

            // reservations to be created
            this.roomReservations = new Reservations();
            this.deskReservations = new Reservations();

            // credits
            this.meetingRoomCredits = new Credit();
            this.desktopCredits = new Credit();
            this.credits = new Credits([
                this.meetingRoomCredits,
                this.desktopCredits
            ]);

            var deskValue = Tandoori.reservation.data.credits.desk || 0;
            var roomValue = Tandoori.reservation.data.credits.meeting_room || 0;

            this.meetingRoomCredits.set({
                type: "meeting_room",
                name: gettext("Salle de réunion"),
                startValue: roomValue,
                value: roomValue
            });
            this.desktopCredits.set({
                type: "desk",
                name: gettext("Bureau"),
                startValue: deskValue,
                value: deskValue
            });


            /*
             * Interactions between Reservations and credit charts
             */

            this.roomReservations.on("add remove", function () {
                var startValue = self.meetingRoomCredits.get("startValue");
                var minutes = 0;
                self.roomReservations.each(function (r) {
                    minutes += r.get("to_date").diff(r.get("from_date"), "minutes");
                });
                // rooms credit unit is 30 min
                var usedCredits = minutes / 30;
                self.meetingRoomCredits.set("value", startValue - usedCredits);
            });

            this.deskReservations.on("add remove", function () {
                var startValue = self.desktopCredits.get("startValue");
                var usedCredits = 0;
                self.deskReservations.each(function (r) {
                    switch (r.get("type")) {
                        case "desk-am":
                        case "desk-pm":
                            usedCredits += 1;
                            break;
                        case "desk-day":
                            usedCredits += 2;
                            break;
                        case "desk-month":
                            usedCredits += 60; // TODO: open days
                            break;
                        default:;
                    }
                });

                self.desktopCredits.set("value", startValue - usedCredits);
            });

        },

        createViews: function () {
            this.views.preview = this.createPreview();
            this.views.availableCredits = this.createCreditsView();
            this.views.calendarMenu = this.createMenuView();
        },

        createPreview: function () {
            var self = this;

            var preview = new ReservationPreview({
                rooms: this.roomReservations,
                desks: this.deskReservations,
                credits: this.credits
            });

            preview.on("buy-clicked", function () {
                // serialize missing credits
                // and redirect to the purchase module with prefilled basket
                var prefill = {};
                var center = Tandoori.reservation.data.centers[0];
                if (self.meetingRoomCredits.get("value") < 0) {
                    prefill[center.room_base_product] = Math.abs(self.meetingRoomCredits.get("value"));
                }
                if (self.desktopCredits.get("value") < 0) {
                    prefill[center.desk_base_product] = Math.abs(self.desktopCredits.get("value"));
                }
                var url = Tandoori.urls.purchase + "?" + $.param({
                    reset: true,
                    prefill: JSON.stringify(prefill)
                });
                // redirect
                window.location = url;
            });

            // lock everything on save
            preview.on("save", function () {
                $("#reservation-container").addClass("locked");
            });

            return preview;
        },
        createCreditsView: function () {
            return new CreditsView({
                collection: this.credits
            });
        },
        createMenuView: function () {
            return new MenuView({
                items: new Menu([{
                    header: true,
                    text: gettext("Durée de la réservation")
                }, {
                    id: "am",
                    text: gettext("Matinée"),
                    rightText: _.template("<%= event && event.start.format('HH:mm') %> - <%= event && event.end.format('HH:mm') %>"),
                    event: null
                }, {
                    id: "pm",
                    text: gettext("Après-midi"),
                    rightText: _.template("<%= event && event.start.format('HH:mm') %> - <%= event && event.end.format('HH:mm') %>"),
                    event: null
                }, {
                    divider: true
                }, {
                    id: "day",
                    text: gettext("Toute la journée"),
                    rightText: _.template("<%= event && event.start.format('HH:mm') %> - <%= event && event.end.format('HH:mm') %>"),
                    event: null
                }, {
                    divider: true
                }, {
                    id: "month",
                    text: _.template('<%= interpolate(gettext("Un mois à partir du <strong>%s</strong>"), [event && event.start.format(\'D MMMM\').replace(/ /g, \'&nbsp;\')]) %>'),
                    event: null
                }])
            });
        },

        createCalendars: function () {
            var self = this;

            var fcOptions = {};
            fcOptions.meeting_room = {
                timezone: "local",
                minTime: openingTimeStr,
                maxTime: closingTimeStr,

                height: "auto",
                dow: [1, 2, 3, 4, 5],
                header: {
                    left: "today",
                    center: "title",
                    right: "prev,next"
                },
                defaultView: "timeline3Days",
                views: {
                    timeline3Days: {
                        type: "timeline",
                        duration: {
                            days: 3
                        },
                        slotDuration: {
                            minutes: 30
                        }
                    }
                },
                resourceAreaWidth: "25%",
                resourceLabelText: gettext("Salles de réunions"),
                resources: resources.length === 1 ? resources[0].children : resources, // if only one center, remove hierarchy

                selectable: true,
                selectHelper: true,
                select: function (start, end, jsEvent, resourceId, view) {
                    // find associated resource
                    var resource = _.chain(resources)
                        .pluck("children")
                        .flatten()
                        .findWhere({id: resourceId})
                        .value();

                    if (resource) {
                        var event = {
                            start: start,
                            end: end,
                            resourceId: resourceId,
                            title: ""
                        };

                        // we need to check if the selection overlaps with an existing event
                        var events = view.events;
                        if (!overlaps(event, events)) {
                            // if the event is on multiple days, split on each day
                            var splittedEvents = splitRoomEvent(event);
                            _.each(splittedEvents, function (event) {
                                self.roomReservations.add(Reservation.create(event, "meeting_room", resource));
                            });
                        }
                    }
                    // Either we added an event and the selection is not needed anymore
                    // or we cancelled it. In both cases, we unselect.
                    self.$roomsCalendar.fullCalendar("unselect");
                },
                events: function (start, end) {
                    var url = Tandoori.urls.list_reservations.replace(0, Tandoori.reservation.data.centers[0].pk);
                    var params = {
                        start: moment(start).toISOString(), // real moment dates
                        end: moment(end).toISOString(),
                        service_type_id: Tandoori.reservation.data.centers[0].room_service_type
                    };

                    function transformEvent(ev) {
                        if (ev.service) {
                            ev.resource = {
                                id: ev.service.id
                            };
                        }
                        ev.title = "";
                        ev.color = "#ccc";
                        // stupid fullcalendar
                        ev.start = moment(ev.start).stripZone();
                        ev.end = moment(ev.end).stripZone();
                        return ev;
                    }

                    $.ajax({
                        url: url,
                        method: "GET",
                        data: $.param(params || {}),
                        success: function (events) {
                            events = _.map(events, transformEvent);

                            self.existingRoomReservations.reset();
                            batchCalendar(self.$roomsCalendar, function () {
                                _.each(events, function (ev) {
                                    self.existingRoomReservations.add(Reservation.create(ev, "meeting_room", ev.resource));
                                });
                            });
                        }
                    });
                }
            };

            fcOptions.desk = {
                height: "auto",
                header: {
                    left: "today",
                    center: "title",
                    right: "prev,next"
                },
                defaultView: "month",
                views: {
                    month: {
                        // hide event start time in month view
                        displayEventTime: true,
                        displayEventEnd: true,
                        fixedWeekCount: false
                    }
                },
                hiddenDays: [6, 0],

                selectable: true,
                selectHelper: true,
                selectOverlap: true, // overlap is restricted in the select callback

                eventClick: function (calEvent, jsEvent, view) {
                    // same as select one day
                    var start = momentTime(calEvent.start, "00:00");
                    var end = moment(start).add(1, "day");
                    // delegate to select with this = view
                    fcOptions.desk.select.call(view, start, end, jsEvent, view);
                },
                select: function (start, end, jsEvent, view) {
                    // start - end is midnight to midnight

                    // if start is in past, abort
                    var today = moment().utc().startOf("day");
                    if (start < today) {
                        self.$desksCalendar.fullCalendar("unselect");
                        return;
                    }

                    var half_day_periods = Tandoori.reservation.data.centers[0].half_day_periods;

                    var am_starttime = momentTime(start, half_day_periods[0].start_time);
                    var am_endtime   = momentTime(start, half_day_periods[0].end_time);
                    var pm_starttime = momentTime(moment(end).subtract(1, "minute"), half_day_periods[1].start_time);
                    var pm_endtime   = momentTime(moment(end).subtract(1, "minute"), half_day_periods[1].end_time);

                    var isMultiDay = !(start.isSame(moment(end).subtract(1, "minute"), "day"));

                    var event = {
                        title: gettext("Votre réservation") + "\n",
                        start: am_starttime,
                        end: pm_endtime
                    };

                    // update menu items
                    var menuItems = self.views.calendarMenu.options.items;
                    menuItems.get("am").set("event", _.extend({}, event, {end: am_endtime}));
                    menuItems.get("pm").set("event", _.extend({}, event, {start: pm_starttime}));
                    menuItems.get("day").set("event", event);
                    menuItems.get("month").set({
                        event: event,
                        disabled: isMultiDay
                    });

                    self.views.calendarMenu.showAt(jsEvent.pageX, jsEvent.pageY, function (menuItem) {
                        self.$desksCalendar.fullCalendar("unselect");
                        // menuItem is used to refine the event
                        var type = menuItem.get("id");
                        switch (type) {
                            case "am":
                                event.end.hours(am_endtime.hours());
                                event.title += gettext("Matinée");
                                break;
                            case "pm":
                                event.start.hours(pm_starttime.hours());
                                event.title += gettext("Après-midi");
                                break;
                            case "day":
                                event.title += gettext("Journée");
                                break;
                            case "month":
                                // TODO: deal with open days?
                                event.end.add(30, "days");
                                event.title += gettext("Mois");
                                break;
                            default:
                                return;
                        }

                        event.type = "desk-" + type;
                        var splittedEvents = splitDeskEvent(event);
                        var events = self.$desksCalendar.fullCalendar("clientEvents");

                        _.each(splittedEvents, function (event) {
                            // we need to check if the selection is allowed
                            if (self.eventAllowed(event, events)) {
                                self.deskReservations.add(Reservation.create(event, "desk-" + type));
                            }
                        });
                    });
                },
                events: function (start, end) {
                    // load user events and availability events

                    var availabilityURL = Tandoori.urls.list_aggregated_reservations.replace(0, Tandoori.reservation.data.centers[0].pk);
                    var userEventsURL = Tandoori.urls.list_own_reservations;


                    var params = {
                        start: moment(start).toISOString(), // real moment dates
                        end: moment(end).toISOString(),
                        service_type: Tandoori.reservation.data.centers[0].desk_service_type
                    };

                    if (!Tandoori.reservation.data.offline) {
                        $.ajax({
                            url: userEventsURL,
                            method: "GET",
                            data: $.param(params),
                            success: function (events) {
                                self.existingDeskReservations.reset();
                                batchCalendar(self.$desksCalendar, function () {
                                    _.each(events, function (ev) {
                                        self.existingDeskReservations.add(Reservation.create(ev, "desk"));
                                    });
                                });

                            }
                        });
                    }

                    // only fetch availability after today
                    var today = moment().utc().startOf("day");
                    if (today > start) {
                        params.start = today.toISOString();
                    }

                    $.ajax({
                        url: availabilityURL,
                        method: "GET",
                        data: $.param(params),
                        success: function (events) {
                            // create missing availability events
                            events = completeDeskEvents(start, end, events);
                            events = _.map(events, function (ev) {
                                _.extend(ev, {
                                    textColor: "#333",
                                    borderColor: "#AAA",
                                    backgroundColor: "#CCC"
                                });
                                return ev;
                            });

                            self.deskAvailabilityFakeReservations.reset();
                            batchCalendar(self.$desksCalendar, function () {
                                _.each(events, function (ev) {
                                    self.deskAvailabilityFakeReservations.add(Reservation.create(ev, "desk"));
                                });
                                self.updateAvailability();
                            });
                        }
                    });
                }
            };


            this.$desksCalendar = $("#reservation_desks_calendar");
            this.$roomsCalendar = $("#reservation_rooms_calendar");

            this.$desksCalendar.fullCalendar(fcOptions.desk);
            this.$roomsCalendar.fullCalendar(fcOptions.meeting_room);


            // patch timeline
            // contrary to what the documentation states, resourceId is not provided
            // this patch fixes it.
            this.$roomsCalendar.fullCalendar("getView").reportSelection = function (t, e) {
                this.isSelected = true;
                this.trigger("select", null, t.start, t.end, e, t.resourceId);
            };

        },
        setupCalendars: function () {
            var self = this;
            this.roomReservations.on("add", function (model) {
                // add to timeline
                var event = model.getFullCalendarEvent();
                event.start.stripZone();
                event.end.stripZone();
                self.$roomsCalendar.fullCalendar("renderEvent", event, true);
            });
            this.roomReservations.on("remove", function (model) {
                // remove from timeline
                self.$roomsCalendar.fullCalendar("removeEvents", [model.id || model.cid]);
            });
            this.deskReservations.on("add", function (model) {
                // add to desk calendar
                var event = model.getFullCalendarEvent();
                self.$desksCalendar.fullCalendar("renderEvent", event, true);
                self.updateAvailability();
            });
            this.deskReservations.on("remove", function (model) {
                // remove from desk calendar
                self.$desksCalendar.fullCalendar("removeEvents", [model.id || model.cid]);
                self.updateAvailability(model);
            });

            this.existingRoomReservations.on("add", function (model) {
                // add to timeline
                var event = model.getFullCalendarEvent();
                event.start.stripZone();
                event.end.stripZone();
                self.$roomsCalendar.fullCalendar("renderEvent", event);
            });

            this.existingDeskReservations.on("add", function (model) {
                // add to desk calendar
                var event = model.getFullCalendarEvent();
                self.$desksCalendar.fullCalendar("renderEvent", event);
            });

            var deskAvailabilityTemplate = _.template(
                "<%= start.hours() < 12 ? 'AM' : 'PM' %>: " +
                // TODO: use gettext's singular/plural support
                '<%= number - count %> <%= (number - count) === 1 ? gettext("bureau libre") : gettext("bureaux libres") %>'
            );

            this.deskAvailabilityFakeReservations.on("add", function (model) {
                // add to desk calendar
                var event = model.getFullCalendarEvent();
                event.title = deskAvailabilityTemplate(event);
                self.$desksCalendar.fullCalendar("renderEvent", event);
            });

            this.deskAvailabilityFakeReservations.on("change", function (model) {
                // find fullcalendar internal event
                var events = self.$desksCalendar.fullCalendar("clientEvents");
                var event = _.findWhere(events, {
                    id: model.cid
                });
                if (event) {
                    _.extend(event, model.getFullCalendarEvent());
                    event.title = deskAvailabilityTemplate(event);
                    self.$desksCalendar.fullCalendar("updateEvent", event);
                }
            });
        },

        render: function () {
            var self = this;
            this.views.preview.render();
            this.views.preview.$el.appendTo("#reservation_preview");
            this.views.availableCredits.render();
            this.views.availableCredits.$el.appendTo("#available_credits");
            this.views.calendarMenu.render();
            this.views.calendarMenu.$el.appendTo(document.body);

            this.createCalendars();
            this.setupCalendars();

            $(".booking-nav a").click(function (ev) {
                ev.preventDefault();
                $(this).tab("show");
                // fullCalendar doesn't remove events when it's hidden
                // since we have removed events while on the other view, let's rerender
                (this.hash === "#desk" ? self.$desksCalendar : self.$roomsCalendar).fullCalendar("rerenderEvents");
            });
            // since fullcalendar doesn't initialize while hidden, we kept all the tabs visible
            // it's time to hide them
            this.$roomsCalendar.parent().removeClass("active");
        },


        updateAvailability: function (removedReservation) {
            var self = this;
            batchCalendar(this.$desksCalendar, function () {
                var fakeReservations;
                if (removedReservation) {
                    fakeReservations = self.getAvailabilityReservationsFromReservation(removedReservation);
                    _.each(fakeReservations, function (fakeReservation) {
                        fakeReservation.set("count", fakeReservation.get("startCount"));
                    });
                }

                self.deskReservations.each(function (reservation) {
                    fakeReservations = self.getAvailabilityReservationsFromReservation(reservation);
                    _.each(fakeReservations, function (fakeReservation) {
                        fakeReservation.set("count", fakeReservation.get("startCount") + 1);
                    });
                });
            });
        },

        getAvailabityReservations: function (eventType, from_date, to_date) {
            // find corresponding availability events
            var filterFn;
            if (eventType === "desk-am" || eventType === "desk-pm") {
                filterFn = function (fakeReservation) {
                    return fakeReservation.get("from_date").isSame(from_date);
                };
            }
            if (eventType === "desk-day") {
                filterFn = function (fakeReservation) {
                    return fakeReservation.get("from_date").isSame(from_date, "day");
                };
            }
            if (eventType === "desk-month") {
                filterFn = function (fakeReservation) {
                    var fakeFrom = fakeReservation.get("from_date");
                    return from_date <= fakeFrom && fakeFrom <= to_date;
                };
            }
            return this.deskAvailabilityFakeReservations.filter(filterFn);
        },

        getAvailabilityReservationsFromReservation: function (reservation) {
            return this.getAvailabityReservations(
                reservation.get("type"),
                reservation.get("from_date"),
                reservation.get("to_date")
            );
        },

        eventAllowed: function (event, events) {
            // check overlapping of events
            var overlapping = overlaps(event, events);
            if (overlapping) {
                return false;
            }
            // check desk availability
            // find corresponding availability fake reservation
            var fakeReservations = this.getAvailabityReservations(event.type, event.start, event.end);
            var allHaveOpenSlot = _.every(fakeReservations, function (fakeReservation) {
                var availableSlots = fakeReservation.get("number") - fakeReservation.get("count");
                return availableSlots > 0;
            });
            return allHaveOpenSlot;
        }
    });

    return App;
});
