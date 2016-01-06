define([
    "underscore"
], function (
    _
) {
    return function (name, tpl) {
        var $overloadingEl = $('#overload_' + name);
        if ($overloadingEl.length > 0) {
            var content = $overloadingEl.text();
            return _.template(content);
        }
        else {
            return tpl;
        }
    }
});
