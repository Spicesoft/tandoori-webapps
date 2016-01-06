define([
    "jquery",
    "underscore",

    "./Base",
    "./List",
    "./MenuItem"
], function (
    $,
    _,

    BaseView,
    ListView,
    MenuItemView
) {
    var Menu = BaseView.extend({
        className: "dropdown clearfix reservation-menu",
        attributes: {
            // TODO: move to CSS
            style: "position:absolute; display:none; z-index: 500;"
        },
        events: {
            "click a": "onItemClick"
        },
        initialize: function (options) {
            Menu.__super__.initialize.apply(this, arguments);
            this.menuList = new ListView({
                dontWrapInLi: true, // <li> already are in ItemView
                className: "dropdown-menu",
                collection: options.items,
                attributes: {
                    role: "menu",
                    // TODO: move to CSS
                    style: "display:block;position:static;margin-bottom:5px;"
                },
                getItemView: function (item) {
                    return new MenuItemView({
                        model: item,
                        attributes: {
                            role: "presentation"
                        }
                    });
                }
            });
            this.onDocumentClick = _.bind(this.onDocumentClick, this);
        },
        render: function () {
            this.menuList.render();
            this.$el.append(this.menuList.$el);
            // block all clicky events from this component
            // TODO: touch events?
            this.$el.on("click mousedown mouseup", function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            });
        },
        showAt: function (x, y, callback) {
            if (typeof callback === "function") {
                this.setCallback(callback);
            }

            // register a click event on the whole document to close the menu
            // in a setTimeout, to avoid the current event (which is not cancelable)
            var onDocumentClick = this.onDocumentClick;
            $(document).off("click", onDocumentClick); // remove if not fired before
            setTimeout(function () {
                $(document).one("click", onDocumentClick);
            }, 0);

            this.$el.css({
                  display: "block",
                  left: x,
                  top: y
            });
        },
        hide: function () {
            this.$el.hide();
        },
        setCallback: function (fn) {
            this.callback = fn;
        },
        onDocumentClick: function (ev) {
            this.hide();
        },
        onItemClick: function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            this.hide();
            var item = this.menuList.modelFromEl(ev.currentTarget);
            if (typeof this.callback === "function") {
                this.callback(item);
            }
        }
    });

    return Menu;
});
