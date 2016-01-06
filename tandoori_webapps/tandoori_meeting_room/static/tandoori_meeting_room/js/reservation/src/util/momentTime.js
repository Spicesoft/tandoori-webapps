define([
    "moment"
], function (
    moment
) {

    // take a moment object and a time string
    // return a new moment object with the date of first moment object and the time from the string
    // ex: momentTime(moment(), '12:00') => today at 12:00
    function momentTime(momentObject, timeString) {
        return moment(momentObject.format("YYYY-MM-DD") + "T" + timeString);
    }

    return momentTime;
});
