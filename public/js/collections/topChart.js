/**
 * Created by Roman on 14.04.2015.
 */
define([
        'collections/events'
    ],
    function (eventsCollection) {

        var TopChartCollection = eventsCollection.extend({
            url: "/events"
        });

        return TopChartCollection;
    });