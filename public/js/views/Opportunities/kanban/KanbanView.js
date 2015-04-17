﻿define([
        'text!templates/Opportunities/kanban/WorkflowsTemplate.html',
        'text!templates/Opportunities/kanbanSettings.html',
        'collections/Workflows/WorkflowsCollection',
        'views/Opportunities/kanban/KanbanItemView',
        'views/Opportunities/EditView',
        'views/Opportunities/CreateView',
        'collections/Opportunities/OpportunitiesCollection',
        'models/OpportunitiesModel',
        'dataService'
],
function (WorkflowsTemplate, kanbanSettingsTemplate, WorkflowsCollection, KanbanItemView, EditView, CreateView, OpportunitiesCollection, CurrentModel, dataService) {
    var collection = new OpportunitiesCollection();
    var OpportunitiesKanbanView = Backbone.View.extend({
        el: '#content-holder',
        events: {
            "dblclick .item": "gotoEditForm",
            "click .item": "selectItem",
			"click .column.fold":"foldUnfoldKanban",
            "click .fold-unfold": "foldUnfoldKanban"
        },

        columnTotalLength: null,
        
        initialize: function (options) {
            this.startTime = options.startTime;
            this.buildTime = 0;
            this.workflowsCollection = options.workflowCollection;
			this.foldWorkflows = [];
            this.render();
            this.asyncFetc(options.workflowCollection);
            this.getCollectionLengthByWorkflows(this);
        },
        updateFoldWorkflow: function () {
			if (this.foldWorkflows.length===0){
				this.foldWorkflows =["Empty"];
			}
            dataService.postData('/currentUser', { 'kanbanSettings.opportunities.foldWorkflows': this.foldWorkflows }, function (seccess, error) {
            });
        },

		foldUnfoldKanban:function(e,id){
			var el;
			if (id){
				el = $("td.column[data-id='"+id+"']");
			}else{
				el=$(e.target).closest("td");
			}
			if (!el.hasClass("fold")){
				el.addClass("fold");
			}else{
				el.removeClass("fold");
			}
			if (el.hasClass("fold")){

				var w = el.find(".columnName .text").width();
				var k = w/2-20;
				if (k<=0){
					k= 20-w/2;
				}
				k=-k;
				el.find(".columnName .text").css({"left":k+"px","top":Math.abs(w/2+47)+"px" });
				this.foldWorkflows.push(el.attr("data-id"));
			}else{
				var idx = this.foldWorkflows.indexOf(el.attr("data-id"));
				if (idx!==-1){
					this.foldWorkflows.splice(idx,1);
				}
			}
			if(!id)
				this.updateFoldWorkflow();
			if (el.closest("table").find(".fold").length==el.closest("table").find(".column").length){
				el.closest("table").css({"min-width":"inherit"});
				el.closest("table").css({"width":"auto"});
			}
			else{
				el.closest("table").css({"min-width":"100%"});
			}
			var k = $(document).height()-115;
			if (k<190){
				k=190;
			}
			el.closest("table").css({"min-height":(k)+"px"});
            this.$(".column").sortable("enable");
            this.$(".column.fold").sortable("disable");
		},
		isNumberKey: function(evt){
			var charCode = (evt.which) ? evt.which : event.keyCode;
			if (charCode > 31 && (charCode < 48 || charCode > 57))
				return false;
			return true;
		},

        saveKanbanSettings: function (context) {
            var countPerPage = context.$el.find('#cPerPage').val();
                if (countPerPage == 0)
                    countPerPage = 5;
            dataService.postData('/currentUser', { 'kanbanSettings.opportunities.countPerPage': countPerPage }, function (seccess, error) {
                if (seccess) {
                    $(".edit-dialog").remove();
					Backbone.history.fragment = '';
                    Backbone.history.navigate("easyErp/Opportunities", { trigger: true });
                }
            });
        },

        hideDialog: function () {
            $(".edit-dialog").remove();
        },

        editKanban: function(e){
			var self = this;
            dataService.getData('/currentUser', null, function (user, context) {
                var tempDom = _.template(kanbanSettingsTemplate, { opportunities: user.kanbanSettings.opportunities });
				var self = context;
                context.$el = $(tempDom).dialog({
                    dialogClass: "edit-dialog",
                    width: "400",
                    title: "Edit Kanban Settings",
                    buttons: {
                        save: {
                            text: "Save",
                            class: "btn",
                            click:function(){
								context.saveKanbanSettings(context);
							}

                        },
                        cancel: {
                            text: "Cancel",
                            class: "btn",
                            click: function () {
                                context.hideDialog();
                            }
                        }
                    }
                });
                // for input type number
                context.$el.find('#cPerPage').spinner({
                    min: 5,
                    max: 9999
                });
            }, this);
        },

        getCollectionLengthByWorkflows: function (context) {
            dataService.getData('/getLengthByWorkflows', {}, function (data) {
                data.arrayOfObjects.forEach(function (object) {
                    var column = context.$("[data-id='" + object._id + "']");
                    column.find('.totalCount').text(object.count);
                });
                if (data.showMore) {
                    context.$el.append('<div id="showMoreDiv" title="To show mor ellements per column, please change kanban settings">And More</div>');
                }
            });
        },

        selectItem: function (e) {
            $(e.target).parents(".item").parents("table").find(".active").removeClass("active");
            $(e.target).parents(".item").addClass("active");
        },

        gotoEditForm: function (e) {
            e.preventDefault();
            var id = $(e.target).closest(".inner").data("id");
            var model = new CurrentModel();
            model.urlRoot = '/Opportunities/form';
            model.fetch({
                data: { id: id },
                success: function (model) {
                    new EditView({ model: model });
                },
                error: function () { alert('Please refresh browser'); }
            });
        },

        asyncFetc: function (workflows) {
            _.each(workflows.toJSON(), function (wfModel) {
                dataService.getData('/Opportunities/kanban', { workflowId: wfModel._id }, this.asyncRender, this);
            }, this);
        },

        asyncRender: function (response,context) {
            var contentCollection = new OpportunitiesCollection();
            contentCollection.set(contentCollection.parse(response));
            if (collection) {
                collection.add(contentCollection.models);
            } else {
                collection = new OpportunitiesCollection();
                collection.set(collection.parse(response));
            }
            var kanbanItemView;
            var column = this.$("[data-id='" + response.workflowId + "']");
			if (response.fold){
				context.foldUnfoldKanban(null,response.workflowId);
			}
            column.find(".counter").html(parseInt(column.find(".counter").html()) + contentCollection.models.length);
            _.each(contentCollection.models, function (wfModel) {
                kanbanItemView = new KanbanItemView({ model: wfModel });
                var curEl = kanbanItemView.render().el;
                column.append(curEl);
            }, this);
        },

        editItem: function () {
            //create editView in dialog here
            var edit = new EditView({ collection: this.collection });
			edit.bind('recalc', this.updateCounter, this);
        },

        createItem: function () {
            //create editView in dialog here
            new CreateView();
        },
		updateSequence:function(item, workflow, sequence, workflowStart, sequenceStart ){
			if (workflow==workflowStart){
				if (sequence>sequenceStart)
					sequence-=1;
				var a = sequenceStart;
				var b = sequence;
				var inc = -1;
				if (a>b){
					a = sequence;
					b = sequenceStart;
					inc = 1;
				}
				$(".column[data-id='"+workflow+"']").find(".item").each(function(){
					var sec = parseInt($(this).find(".inner").attr("data-sequence"));
					if (sec>=a&&sec<=b)
						$(this).find(".inner").attr("data-sequence",sec+inc);
				});
				item.find(".inner").attr("data-sequence",sequence);
				
			}else{
				$(".column[data-id='"+workflow+"']").find(".item").each(function(){
					if (parseInt($(this).find(".inner").attr("data-sequence"))>=sequence)
						$(this).find(".inner").attr("data-sequence",parseInt($(this).find(".inner").attr("data-sequence"))+1);
				});
				$(".column[data-id='"+workflowStart+"']").find(".item").each(function(){
					if (parseInt($(this).find(".inner").attr("data-sequence"))>=sequenceStart)
						$(this).find(".inner").attr("data-sequence",parseInt($(this).find(".inner").attr("data-sequence"))-1);
				});
				item.find(".inner").attr("data-sequence",sequence);

			}
		},
        updateCounter:function(el,inc){
			var i = inc?1:-1;
			var counter = el.closest(".column").find(".totalCount");
			counter.html(parseInt(counter.html())+i);
		},
        render: function () {
			var self = this;
			
            var workflows = this.workflowsCollection.toJSON();
            this.$el.html(_.template(WorkflowsTemplate, { workflowsCollection: workflows }));
            $(".column").last().addClass("lastColumn");
            var itemCount;
            _.each(workflows, function (workflow, i) {
                itemCount = 0;
                var column = this.$(".column").eq(i);
                //var count = " <span>(<span class='counter'>" + itemCount + "</span> / </span>";
                var total = " <span><span class='totalCount'>" + itemCount + "</span></span>";
                column.find(".columnNameDiv h2").append(total);
            }, this);
            
            this.$(".column").sortable({
                connectWith: ".column",
                cancel: "h2",
                cursor: "move",
                items: ".item",
                opacity: 0.7,
                revert: true,
                helper: 'clone',
                containment:'document',
                start: function (event, ui) {
					self.updateCounter(ui.item,false);
                },

                stop: function (event, ui) {
                    var id = ui.item.context.id;
                    var model = collection.get(id);
                    var column = ui.item.closest(".column");
					var sequence = 0;
					if (ui.item.next().hasClass("item")){
						sequence = parseInt(ui.item.next().find(".inner").attr("data-sequence"))+1;
					}
                    if (model) {
						var secStart = parseInt($(".inner[data-id='"+model.toJSON()._id+"']").attr("data-sequence"));
						var workStart =  model.toJSON().workflow._id?model.toJSON().workflow._id:model.toJSON().workflow;
						model.save({ workflow: column.data('id'), sequenceStart:parseInt($(".inner[data-id='"+model.toJSON()._id+"']").attr("data-sequence")), sequence:sequence, workflowStart : model.toJSON().workflow._id?model.toJSON().workflow._id:model.toJSON().workflow}, {
							patch:true,
							validate: false,
							success: function (model2) {
								self.updateSequence(ui.item, column.attr("data-id"), sequence,workStart,secStart );

								collection.add(model2,{merge:true});
							}
						});
						self.updateCounter(column,true);
                    }
                }
            }).disableSelection();
            this.$el.append("<div id='timeRecivingDataFromServer'>Created in " + (new Date() - this.startTime) + " ms</div>");
			$(document).on("keypress","#cPerPage",this.isNumberKey);

			this.$el.unbind();
			return this;
        }
    });
	
    return OpportunitiesKanbanView;
});
