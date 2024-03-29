﻿define([
    'text!templates/Clients/ListTemplate.html'
],

function (ListTemplate) {
    var ListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function(options) {
            this.collection = options.collection;
            this.startNumber = (options.page - 1 ) * options.itemsNumber;//Counting the start index of list items
        },

        render: function() {
            this.$el.append(_.template(ListTemplate, { saasDbs: this.collection.toJSON(), startNumber: this.startNumber }));
        }
    });

    return ListItemView;
});
