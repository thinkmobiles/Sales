define([
    'text!templates/Workflows/TopBarTemplate.html',
    'custom',
    'common'
],
    function (ContentTopBarTemplate, Custom, Common) {
        var TopBarView = Backbone.View.extend({
            el: '#top-bar',
            contentType: "Workflows",
            actionType: null, //Content, Edit, Create
            template: _.template(ContentTopBarTemplate),

            events: {
                "click a.changeContentView": 'changeContentViewType',
                "click ul.changeContentIndex a": 'changeItemIndex',
                "click #top-bar-saveBtn": "saveEvent",
                "click #top-bar-discardBtn": "discardEvent",
                "click #top-bar-editBtn": "editEvent",
                "click #top-bar-createBtn": "createEvent"
            },

            changeContentViewType: Custom.changeContentViewType,

            changeItemIndex: Custom.changeItemIndex,

            initialize: function (options) {
                this.actionType = options.actionType;
                this.render();
            },

            render: function () {
                $('title').text(this.contentType);
                this.$el.html(this.template({contentType: this.contentType}));
                Common.displayControlBtnsByActionType(this.actionType);

                return this;
            },

            deleteEvent: function (event) {
                event.preventDefault();
                var answer = confirm("Realy DELETE items ?!");
                if (answer == true) this.trigger('deleteEvent');
            },

            saveEvent: function (event) {
                event.preventDefault();
                this.trigger('saveEvent');
            },

            discardEvent: function (event) {
                event.preventDefault();
                Backbone.history.navigate("home/content-" + this.contentType, { trigger: true });
            },
            createEvent: function (event) {
                event.preventDefault();
                this.trigger('createEvent');
            }
        });

        return TopBarView;
    });
