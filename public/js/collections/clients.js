/**
 * Created by Roman on 14.04.2015.
 */
define([
        'moment'
    ],
    function (moment) {
        var ClientModel = Backbone.Model.extend({
            idAttribute: "_id"
        });

        var UsersCollection = Backbone.Collection.extend({
            model: ClientModel,
            url: "/events",
            page:null,
            namberToShow: null,
            viewType: null,
            contentType: null,

            initialize: function (options) {
                this.startTime = new Date();
                var that = this;
                this.namberToShow = options.count;
                this.page = options.page || 1;

                this.fetch({
                    data: options,
                    reset: true,
                    success: function () {
                        that.page++;
                    },
                    error: function (models, xhr) {
                        if (xhr.status == 401) Backbone.history.navigate('#login', { trigger: true });
                    }
                });
            },

            showMore: function (options) {
                var that = this;
                var filterObject = options || {};
                filterObject['page'] = (options && options.page) ? options.page: this.page;
                filterObject['count'] = (options && options.count) ? options.count: this.namberToShow;
                this.fetch({
                    data: filterObject,
                    waite: true,
                    success: function (models) {
                        that.page++;
                        that.trigger('showmore', models);
                    },
                    error: function () {
                        alert('Some Error');
                    }
                });
            },

            parse: true,
            parse: function (response) {
                if (response) {
                    _.map(response, function (company) {
                        if (company.date)
                            company.date = moment(company.date).format("D/M/YYYY HH:mm");
                        return company;
                    });
                }
                return response;
            }
        });
        return UsersCollection;
    });