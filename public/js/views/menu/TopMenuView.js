define([
    'text!templates/menu/TopMenuTemplate.html',
], function (TopMenuTemplate) {

    var TopMenuView = Backbone.View.extend({
        el: '#mainmenu-holder',
        initialize: function (options) {
            this.render();
        },
        events: {
            "click #topMenu li a":"setActive"
        },
        setActive:function(e){
            $(e.target).closest("ul").find(">li.active").removeClass("active");
            $(e.target).closest("li").addClass("active");

        },
        render: function(options){
            this.$el.html(_.template(TopMenuTemplate));
            this.$el.find("#topMenu>li.active").removeClass("active");
            var hash = window.location.hash.toString().split("list")[0]+"list";
            var li =this.$el.find("#topMenu a[href='"+hash+"']").parents("li");
            li.addClass("active");

            return this;
        },

    });

    return TopMenuView;

});