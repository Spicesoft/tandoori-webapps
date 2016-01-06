define([], function () {

    function batchCalendar($calendar, fn) {
        /*
         * Adding events one by one takes a huge time so we add them to a
         * detached calendar. That way, events are added without rendering.
         * We call rerender once at the end.
         */
        var $parent = $calendar.parent();
        $calendar.detach();
        fn();
        $calendar.appendTo($parent);
        $calendar.fullCalendar("rerenderEvents");
    }

    return batchCalendar;
});
