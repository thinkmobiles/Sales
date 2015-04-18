// Filename: router.js
define([
  'views/main/MainView',
  'views/login/LoginView',
  'custom'
], function (mainView, loginView, custom) {

    var appRouter = Backbone.Router.extend({

        wrapperView: null,
        mainView: null,
        topBarView: null,
        view: null,

        routes: {
            "home": "any",
            "login": "login",
            /*":contentType/form/:modelId": "goToForm",*/
            "clients/list(/p=:page)(/c=:countPerPage)(/filter=:filter)": "goToClientsList",
            "dashboard": "goToDashboard",
            "*any": "any"
        },

        initialize: function () {
            $(document).on("click", function (e) {
                if ($(e.target).closest(".popUp").length === 0 ) {
                    $(".popUp").hide();
                }
            });
        },

       goToClientsList: function (page, countPerPage, filter) {
            var that = this;
            this.checkLogin(function (success) {
                if (success) {
                    clients(that);
                } else {
                    if (App.requestedURL == null)
                        App.requestedURL = Backbone.history.fragment;
                    Backbone.history.fragment = "";
                    Backbone.history.navigate("login", { trigger: true });
                }
            });

            function clients(context) {
                var startTime = new Date();
                var contentViewUrl = "views/Clients/ListView";
                var topBarViewUrl = "views/Clients/TopBarView";
                var collectionUrl = "collections/clients";
                var self = context;
                var newCollection = true;

                if (context.mainView === null) {
                    context.main("Persons");
                } else {
                    context.mainView.updateMenu("Persons");
                }


                var navigatePage = (page) ? parseInt(page) || 1 : 1;
                var count = (countPerPage) ? parseInt(countPerPage) || 50 : 50;

                if (!filter) {
                    filter = {clientList: true};
                } else if (filter) {
                    filter = JSON.parse(filter);
                }

                require([contentViewUrl, topBarViewUrl, collectionUrl], function(contentView, topBarView, contentCollection) {
                    var collection = new contentCollection({
                        page: navigatePage,
                        count: count,
                        filter: filter,
                        newCollection: newCollection
                    });

                    collection.bind('reset', _.bind(createViews, self));

                    function createViews() {
                        collection.unbind('reset');
                        var topbarView = new topBarView({ actionType: "Content", collection: collection });
                        var contentview = new contentView({ collection: collection, startTime: startTime, filter: filter, newCollection: newCollection });

                        topbarView.bind('createEvent', contentview.createItem, contentview);
                        topbarView.bind('editEvent', contentview.editItem, contentview);
                        topbarView.bind('deleteEvent', contentview.deleteItems, contentview);

                        collection.bind('showmore', contentview.showMoreContent, contentview);
                        context.changeView(contentview);
                        context.changeTopBarView(topbarView);
                    }
                });
            }
        },

        goToDashboard: function () {
            var that = this;
            this.checkLogin(function (success) {
                if (success) {
                    goDashboard(that);
                } else {
                    if (App.requestedURL == null)
                        App.requestedURL = Backbone.history.fragment;
                    Backbone.history.fragment = "";
                    Backbone.history.navigate("login", { trigger: true });
                }
            });

            function goDashboard(context) {
                var startTime = new Date();
                var contentViewUrl = "views/Dashboard/ContentView";
                var topBarViewUrl = "views/Dashboard/TopBarView";
                var self = context;

                if (context.mainView === null) {
                    context.main("Dashboard");
                } else {
                    context.mainView.updateMenu("Dashboard");
                }

                require([contentViewUrl, topBarViewUrl], function (contentView, topBarView) {

                    custom.setCurrentVT('list');

                    var contentview = new contentView({ startTime: startTime });
                    var topbarView = new topBarView({ actionType: "Content" });
                    self.changeView(contentview);
                    self.changeTopBarView(topbarView);
                });
            }
        },


        buildCollectionRoute: function (contentType) {
            if (!contentType) {
                throw new Error("Error building collection route. ContentType is undefined");
            }
            switch (contentType) {
                case 'Birthdays':
                    return "collections/" + contentType + "/filterCollection";
                default:
                    return "collections/" + contentType + "/filterCollection";
            }
        },

        goToList: function (contentType, parrentContentId, page, countPerPage, filter) {
            var that = this;

            this.checkLogin(function (success) {
                if (success) {
                    goList(that);
                } else {
                    if (App.requestedURL == null)
                        App.requestedURL = Backbone.history.fragment;
                    Backbone.history.fragment = "";
                    Backbone.history.navigate("login", { trigger: true });
                }
            });

            function goList(context) {
                var currentContentType = context.testContent(contentType);
                if (contentType !== currentContentType) {
                    contentType = currentContentType;
                    var url = contentType + '/list';
                    if (parrentContentId)
                        url += '/' + parrentContentId;
                    Backbone.history.navigate(url, { replace: true });
                }
                var newCollection = true;
                var self = context;
                var startTime = new Date();
                var contentViewUrl = "views/" + contentType + "/list/ListView";
                var topBarViewUrl = "views/" + contentType + "/TopBarView";
                var collectionUrl = context.buildCollectionRoute(contentType);
                var navigatePage = (page) ? parseInt(page) || 1 : 1;
                var count = (countPerPage) ? parseInt(countPerPage) || 50 : 50;

                if (filter === 'empty') {
                    newCollection = false;
                } else if (filter) {
                    filter = JSON.parse(filter);
                }
                if (context.mainView === null) {
                    context.main(contentType);
                } else {
                    context.mainView.updateMenu(contentType);
                }

                require([contentViewUrl, topBarViewUrl, collectionUrl], function(contentView, topBarView, contentCollection) {
                    var collection = new contentCollection({
                        viewType: 'list',
                        page: navigatePage,
                        count: count,
                        filter: filter,
                        parrentContentId: parrentContentId,
                        contentType: contentType,
                        newCollection: newCollection
                    });

                    collection.bind('reset', _.bind(createViews, self));
                    custom.setCurrentVT('list');

                    function createViews() {
                        collection.unbind('reset');
                        var topbarView = new topBarView({ actionType: "Content", collection: collection });
                        var contentview = new contentView({ collection: collection, startTime: startTime, filter: filter, newCollection: newCollection });

                        topbarView.bind('createEvent', contentview.createItem, contentview);
                        topbarView.bind('editEvent', contentview.editItem, contentview);
                        topbarView.bind('deleteEvent', contentview.deleteItems, contentview);

                        collection.bind('showmore', contentview.showMoreContent, contentview);
                        context.changeView(contentview);
                        context.changeTopBarView(topbarView);
                    }
                });
            }
        },

        goToForm: function (contentType, modelId) {
            var that = this;
            this.checkLogin(function (success) {
                if (success) {
                    goForm(that);
                } else {
                    if (App.requestedURL == null)
                        App.requestedURL = Backbone.history.fragment;
                    Backbone.history.fragment = "";
                    Backbone.history.navigate("login", { trigger: true });
                }
            });

            function goForm(context) {
                var currentContentType = context.testContent(contentType);
                if (contentType !== currentContentType) {
                    contentType = currentContentType;
                    var url = contentType + '/form';
                    if (modelId)
                        url += '/' + modelId;
                    Backbone.history.navigate(url, { replace: true });
                }
                var self = context;
                var startTime = new Date();
                var contentFormModelUrl;
                var contentFormViewUrl;
                var topBarViewUrl;
                if (context.mainView === null) {
                    context.main(contentType);
                } else {
                    context.mainView.updateMenu(contentType);
                }

                if (contentType !== 'ownCompanies') {
                    contentFormModelUrl = "models/" + contentType + "Model";
                    contentFormViewUrl = "views/" + contentType + "/form/FormView";
                    topBarViewUrl = "views/" + contentType + "/TopBarView";
                } else {
                    contentFormModelUrl = "models/CompaniesModel";
                    contentFormViewUrl = "views/" + contentType + "/form/FormView";
                    topBarViewUrl = "views/" + contentType + "/TopBarView";
                }

                custom.setCurrentVT('form');
                require([contentFormModelUrl, contentFormViewUrl, topBarViewUrl], function(contentFormModel, contentFormView, topBarView) {
                    var getModel = new contentFormModel();

                    getModel.urlRoot = '/' + contentType + '/form';
                    getModel.fetch({
                        data: { id: modelId },
                        success: function(model) {
                            var topbarView = new topBarView({ actionType: "Content" });
                            var contentView = new contentFormView({ model: model, startTime: startTime });

                            topbarView.bind('deleteEvent', contentView.deleteItems, contentView);
                            topbarView.bind('editEvent', contentView.editItem, contentView);

                            contentView.render();
                            self.changeView(contentView);
                            self.changeTopBarView(topbarView);
                        },
                        error: function(model, response) {
                            if (response.status === 401) Backbone.history.navigate('#login', { trigger: true });
                        }
                    });
                });
            }
        },

        changeWrapperView: function (wrapperView) {
            if (this.wrapperView) {
                this.wrapperView.undelegateEvents();
            }
            this.wrapperView = wrapperView;
        },

        changeTopBarView: function (topBarView) {
            if (this.topBarView) {
                this.topBarView.undelegateEvents();
            }
            this.topBarView = topBarView;
        },

        changeView: function (view) {
            if (this.view) {
                this.view.undelegateEvents();
            }
            $(document).trigger("resize");
            this.view = view;
        },

        main: function (contentType) {
            this.mainView = new mainView({ contentType: contentType });
            this.changeWrapperView(this.mainView);
        },

        any: function () {
            this.mainView = new mainView();
            this.changeWrapperView(this.mainView);
        },

        login: function () {
            this.changeWrapperView(new loginView());
        }
    });

    return appRouter;
});
