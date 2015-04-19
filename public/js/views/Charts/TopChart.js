/**
 * Created by Roman on 19.04.2015.
 */
define([
    'collections/topChart',
    'text!templates/Charts/topChart.html'
], function (topChartCollection, topChart) {

    var TopMenuView = Backbone.View.extend({
        el: '#chart',
        className: 'topChartEl',
        template: _.template(topChart),
        initialize: function (options) {
            var self = this;
            this.collection = new topChartCollection({
                g: 'country',
                registerType: 'saasTrial'
            });

            this.collection.bind('reset', this.render, this);
            $(window).on("resize", function (e) {
                $('#topChart').empty();
                self.render();
            });
        },
        events: {
            "click .chartButtons span a": "fetchNew"
        },

        fetchNew: function (e) {
            var self = this;
            var id = $(e.target).closest('span').attr('id');
            var collection = new topChartCollection({
                g: 'country',
                registerType: id
            });
            collection.bind('reset', function () {
                self.collection.reset(collection.toJSON());
            });

        },

        render: function () {
            $('#topChart').empty();

            var WIDTH = this.$el.width();
            var HEIGH = this.$el.height();
            var saasData = this.collection.toJSON();
            var margin = {top: 20, right: 40, bottom: 30, left: 60};
            var width = WIDTH - margin.left - margin.right - 15;
            var height = HEIGH - margin.top - margin.bottom;
            var now = new Date();
            var year = now.getYear();
            var month = now.getYear() + 1;
            var maxDays = daysInMonth(month, year);
            var barWidth = Math.floor(width / maxDays) - 5;
            var xAxisData = [];

            var x = d3.scale.linear().range([margin.left, width]);

            var y = d3.scale.linear().range([height, margin.bottom]);
            var topChart = d3.select("#topChart");

            for (var i = 1; i <= maxDays; i++) {
                xAxisData.push(i);
            }

            function daysInMonth (month, year) {
                return new Date(year, month, 0).getDate();
            }

            topChart
                .append("g")
                .attr("width", width)
                .attr("height", height);

            x.domain([1, maxDays]);

            y.domain([0, d3.max(saasData.map(function (d) {
                return d.count;
            }))]);


            topChart.selectAll("rect").
                data(saasData)
                .enter()
                .append("svg:rect")
                .attr("x", function (datum, index) {
                    return x(datum._id);
                })
                .attr("y", function (datum) {
                    return y(datum.count);
                })
                .attr("height", function (datum) {
                    return height - y(datum.count);
                })
                .attr("width", barWidth)
                .attr("fill", "#2d578b");

            topChart.selectAll("text")
                .data(saasData)
                .enter()
                .append("svg:text")
                .attr('class', 'inBarText')
                .attr("x", function (datum, index) {
                    return x(datum._id);
                })
                .attr("y", function (datum) {
                    return y(datum.count);
                })
                .attr("dx", barWidth / 2)
                .attr("dy", "1.2em")
                .attr("text-anchor", "middle")
                .text(function (datum) {
                    return datum.count
                })
                .attr("fill", "white");

            var xAxis = d3.svg.axis()
                .scale(x)
                .ticks(maxDays)
                .tickSubdivide(true);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient('left')
                .ticks(0)
                .tickSubdivide(false);

            topChart.append('svg:g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(' + (margin.left - margin.right) + ',' + (height + 5) + ')')
                .call(xAxis);

            topChart.append('svg:g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(' + (margin.left + 20) + ', 0 )')
                .call(yAxis);

            topChart.append('svg:text')
                .attr("x", x(maxDays / 2))
                .attr("y", HEIGH - 5)
                .attr('class', 'xAxesName')
                .text('Date');

            topChart.append('svg:text')
                .attr("x", 20)
                .attr("y", HEIGH - 5)
                .attr('class', 'xAxesName')
                .text('Number')
                .attr("transform", 'translate(-' + (margin.left + margin.right + 30) + ',' + (HEIGH / 2 + 30) + ') rotate(-90)');

            this.$el.find('.chartButtons').remove();
            this.$el.append(this.template);

            return this;
        }

    });

    return TopMenuView;

});