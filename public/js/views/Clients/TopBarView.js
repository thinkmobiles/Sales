define([
    'text!templates/Clients/TopBarTemplate.html',
    'custom'
],
    function (TopBarTemplate, Custom) {
        var TopBarView = Backbone.View.extend({
            el:'#top-bar',
            contentType: "My Clients",
            actionType: null, //Content, Edit, Create
            template: _.template(TopBarTemplate),
            
            events:{

            },

            initialize: function(options){
                this.actionType = options.actionType;
                this.render();
            },

            render: function(){
                $('title').text(this.contentType);
                this.$el.html(this.template({contentType: this.contentType}));

                return this;
            }
        });

        return TopBarView;
    });
