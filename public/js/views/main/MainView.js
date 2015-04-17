define([
    'text!templates/main/MainTemplate.html',
    'views/menu/LeftMenuView',
    'collections/menu/MenuItems',
    'views/menu/TopMenuView',
    'dataService'
], function (MainTemplate, LeftMenuView, MenuItemsCollection, TopMenuView, dataService) {

    var MainView = Backbone.View.extend({
        el: '#wrapper',
        events: {
            'click #loginPanel': 'showSelect',
            'click': 'hideProp'
        },
        initialize: function (options) {
            this.contentType = options ? options.contentType : null;
            this.render();
            this.collection = new MenuItemsCollection();
            this.collection.bind('reset', this.createMenuViews, this);
        },
        hideProp: function (e) {
            if ($(e.target).closest("#loginPanel").length === 0) {
                var select = this.$el.find('#loginSelect');
                select.hide();
                select.prop('hidden', true);
            }
        },
        createMenuViews: function () {
            var currentRoot = null;
            var currentChildren = null;
            if (this.contentType) {
                currentChildren = this.collection.where({href: this.contentType});
                var currentRootId = currentChildren[0].get("parrent");
                currentRoot = this.collection.where({_id: currentRootId});
            }
            this.leftMenu = new LeftMenuView({
                collection: this.collection,
                currentChildren: currentChildren,
                currentRoot: currentRoot
            });
            this.topMenu = new TopMenuView({
                collection: this.collection.getRootElements(),
                currentRoot: currentRoot,
                leftMenu: this.leftMenu
            });
            this.topMenu.bind('changeSelection', this.leftMenu.setCurrentSection, {leftMenu: this.leftMenu});
            this.topMenu.bind('mouseOver', this.leftMenu.mouseOver, {leftMenu: this.leftMenu});
        },
        updateMenu: function (contentType) {
            var currentChildren = this.collection.where({href: contentType});
            var currentRootId = currentChildren[0].get("parrent");
            var currentRoot = this.collection.where({_id: currentRootId});
            this.leftMenu.updateLeftMenu(currentChildren, currentRoot);
            this.topMenu.updateTopMenu(currentRoot);
        },
        showSelect: function (e) {
            var select = this.$el.find('#loginSelect');
            if (select.prop('hidden')) {
                select.show();
                select.prop('hidden', false);
            } else {
                select.hide();
                select.prop('hidden', true);
            }
        },
        render: function () {
            var self = this;
            dataService.getData('/currentUser', null, function (response, context) {
                if (response && response.profile && response.profile.profileName == 'baned') {
                    $('title').text("EasyERP");
                    context.$el.find("li#userpage").remove();
                    context.$el.find("#top-bar").addClass("banned");
                    context.$el.find("#content-holder").append("<div id = 'banned'><div class='icon-banned'></div><div class='text-banned'><h1>Sorry, this user is banned!</h1><p>Please contact the administrator.</p></div></div>");
                }
                if (response.RelatedEmployee) {
                    $("#loginPanel .iconEmployee").attr("src", response.RelatedEmployee.imageSrc);
                    if (response.RelatedEmployee.name) {
                        $("#loginPanel  #userName").text(response.RelatedEmployee.name.first + " " + response.RelatedEmployee.name.last);
                    } else {
                        $("#loginPanel  #userName").text(response.login);
                    }
                } else {
                    $("#loginPanel .iconEmployee").attr("src", response.imageSrc);
                    $("#loginPanel  #userName").text(response.login);
                }
            }, this);
            this.$el.html(_.template(MainTemplate));
            return this;
        }
    });
    return MainView;
});