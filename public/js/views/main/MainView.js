define([
    'text!templates/main/MainTemplate.html',
], function (MainTemplate) {

    var MainView = Backbone.View.extend({
        el: '#wrapper',

        initialize: function (options) {
            this.contentType = options ? options.contentType : null;
            this.render();
        },

        render: function () {
            this.$el.html(_.template(MainTemplate));

            return this;
        }
    });

    return MainView;
});