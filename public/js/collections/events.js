/**
 * Created by Roman on 14.04.2015.
 */
define([
        'moment'
    ],
    function (moment) {
        var TopChartModel = Backbone.Model.extend({
            idAttribute: "_id"
        });

        var TopChartCollection = Backbone.Collection.extend({
            model: TopChartModel,
            url: "/events",

            initialize: function (options) {
                this.fetch({
                    data: options,
                    reset: true,
                    success: function () {

                    },
                    error: function (models, xhr) {
                        if (xhr.status == 401) Backbone.history.navigate('#login', { trigger: true });
                    }
                });
            }
        });
        return TopChartCollection;
    });