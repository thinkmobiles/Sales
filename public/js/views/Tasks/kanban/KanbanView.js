﻿define([
    'text!templates/Tasks/kanban/WorkflowsTemplate.html',
    'text!templates/Tasks/kanbanSettings.html',
    'collections/Workflows/WorkflowsCollection',
    'views/Tasks/kanban/KanbanItemView',
    'views/Tasks/EditView',
    'views/Tasks/CreateView',
    'collections/Tasks/TasksCollection',
    'models/TasksModel',
    'dataService',
    'common',
	'populate'
],
    function (WorkflowsTemplate, kanbanSettingsTemplate, WorkflowsCollection, KanbanItemView, EditView, CreateView, TasksCollection, CurrentModel, dataService, common, populate) {
        var collection = new TasksCollection();
        var TasksKanbanView = Backbone.View.extend({
            el: '#content-holder',
            events: {
                "dblclick .item": "gotoEditForm",
                "click .item": "selectItem",
                "click .fold-unfold": "foldUnfoldKanban",
                "click .current-selected": "showNewSelect",
                "click .newSelectList li:not(.miniStylePagination)": "chooseOption",
                "click .newSelectList li.miniStylePagination": "notHide",
                "click .newSelectList li.miniStylePagination .next:not(.disabled)": "nextSelect",
                "click .newSelectList li.miniStylePagination .prev:not(.disabled)": "prevSelect",
                "click .column.fold": "foldUnfoldKanban",
                "click": "hideNewSelect"
            },

            columnTotalLength: null,

            initialize: function (options) {
                this.startTime = options.startTime;
                this.workflowsCollection = options.workflowCollection;
                this.render();
                this.asyncFetch(options.workflowCollection, options.parrentContentId);
                this.getCollectionLengthByWorkflows(this, options.parrentContentId);
                this.responseObj = {};
                this.foldWorkflows = [];
            },
            notHide: function (e) {
                return false;
            },
            updateFoldWorkflow: function () {
                if (this.foldWorkflows.length === 0) {
                    this.foldWorkflows = ["Empty"];
                }
                dataService.postData('/currentUser', { 'kanbanSettings.tasks.foldWorkflows': this.foldWorkflows }, function (seccess, error) {
                });
            },
            foldUnfoldKanban: function (e, id) {
                var el;
                if (id) {
                    el = $("#" + id);
                } else {
                    el = $(e.target).closest("td");
                }
                el.toggleClass("fold");
                if (el.hasClass("fold")) {
                    var w = el.find(".columnName .text").width();
                    var k = w / 2 - 21;
                    if (k < 0) {
                        k = -2 - k;
                    }
                    k = -k;
                    el.find(".columnName .text").css({ "left": k + "px", "top": Math.abs(w / 2 + 47) + "px" });
                    this.foldWorkflows.push(el.attr("id"));
                } else {
                    var idx = this.foldWorkflows.indexOf(el.attr("id"));
                    if (idx !== -1) {
                        this.foldWorkflows.splice(idx, 1);
                    }
                }
                if (!id)
                    this.updateFoldWorkflow();
                if (el.closest("table").find(".fold").length == el.closest("table").find(".column").length) {
                    el.closest("table").css({ "min-width": "inherit" });
                }
                else {
                    el.closest("table").css({ "min-width": "100%" });
                }
                el.closest("table").css({ "min-height": ($(window).height() - 110) + "px" });
				this.$(".column").sortable("enable");
				this.$(".column.fold").sortable("disable");
            },
            nextSelect: function (e) {
                this.showNewSelect(e, false, true);
            },
            prevSelect: function (e) {
                this.showNewSelect(e, true, false);
            },
            showNewSelect: function (e, prev, next) {
                populate.showSelectPriority(e, prev, next, this);
                return false;

            },

            hideNewSelect: function (e) {
                $(".newSelectList").hide();
            },

            chooseOption: function (e) {
                var currentSelected = $(e.target).parents(".taskSelect").find(".current-selected");
                var selectType = currentSelected.attr("id").split('_')[0];
                var model;
                var id;
                currentSelected.text($(e.target).text());
                if (selectType == 'priority') {
                    id = currentSelected.attr("id").replace("priority_", "");
                    model = collection.get(id);
                    var priority = currentSelected.text();
                    model.save({
                        priority: priority
                    },
                    {
                        headers: {
                            mid: 39
                        },
                        patch: true,
                        success: function () {
                        }
                    });
                } else if (selectType == 'type') {
                    var type = currentSelected.text();
                    id = currentSelected.attr("id").replace("type_", "");
                    model = collection.get(id);
                    model.save({
                        type: type
                    },
                    {
                        headers: {
                            mid: 39
                        },
                        patch: true,
                        success: function () {

                        }
                    });
                }
                this.hideNewSelect();
                return false;
            },

            isNumberKey: function (evt) {
                var charCode = (evt.which) ? evt.which : event.keyCode;
                if (charCode > 31 && (charCode < 48 || charCode > 57))
                    return false;
                return true;
            },

            saveKanbanSettings: function () {
                var countPerPage = $(this).find('#cPerPage').val();
                if (countPerPage == 0)
                    countPerPage = 5;
                var id = window.location.hash.split('/')[3];
                var url = (id && id.length === 24) ? "easyErp/Tasks/kanban/" + id : "easyErp/Tasks/kanban";
                dataService.postData('/currentUser', { 'kanbanSettings.tasks.countPerPage': countPerPage }, function (seccess, error) {
                    if (seccess) {
                        $(".edit-dialog").remove();
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(url, { trigger: true });
                    }
                });
            },

            hideDialog: function () {
                $(".edit-dialog").remove();
            },

            editKanban: function (e) {
                dataService.getData('/currentUser', null, function (user, context) {
                    var tempDom = _.template(kanbanSettingsTemplate, { tasks: user.kanbanSettings.tasks });
                    context.$el = $(tempDom).dialog({
                        dialogClass: "edit-dialog",
                        width: "400",
                        title: "Edit Kanban Settings",
                        buttons: {
                            save: {
                                text: "Save",
                                class: "btn",
                                click: context.saveKanbanSettings
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
                    context.$el.find('#cPerPage').spinner({
                        min: 5,
                        max: 9999
                    });
                }, this);
            },

            getCollectionLengthByWorkflows: function (context, parrentContentId) {
                dataService.getData('/getTasksLengthByWorkflows', { parrentContentId: parrentContentId }, function (data) {
                    data.arrayOfObjects.forEach(function (object) {
                        var column = context.$el.find("#" + object._id);
                        column.find('.totalCount').text(object.count);
                        column.find('.remaining').text(object.remaining);
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
                model.urlRoot = '/Tasks/form';
                model.fetch({
                    data: { id: id },
                    success: function (model) {
                        new EditView({ model: model });
                    },
                    error: function () { alert('Please refresh browser'); }
                });
            },

            asyncFetch: function (workflows, parrentContentId) {
                _.each(workflows.toJSON(), function (wfModel) {
                    dataService.getData('/Tasks/kanban', { workflowId: wfModel._id, parrentContentId: parrentContentId }, this.asyncRender, this);
                }, this);
            },

            asyncLoadImgs: function (collection) {
                var arr = _.filter(collection, function (item) {
                    return item.assignedTo !== null;
                });
                var ids = _.map(arr, function (item) {
                    return item.assignedTo._id;
                });
                //added condition(ids.length>0)  if no ids don't run common code)
                if(ids.length>0)common.getImages(ids, "/getEmployeesImages");
            },

            asyncRender: function (response, context) {
                var contentCollection = new TasksCollection();
                contentCollection.set(contentCollection.parse(response));
                if (collection) {
                    collection.add(contentCollection.models);
                } else {
                    collection = new TasksCollection();
                    collection.set(collection.parse(response));
                }
                var kanbanItemView;
                var column = context.$el.find("#" + response.workflowId);
                if (response.fold) {
                    context.foldUnfoldKanban(null, response.workflowId);
                }
                column.find(".counter").html(parseInt(column.find(".counter").html()) + contentCollection.models.length);
                _.each(contentCollection.models, function (wfModel) {
                    kanbanItemView = new KanbanItemView({ model: wfModel });
                    var curEl = kanbanItemView.render().el;
                    column.append(curEl);
                }, this);


                context.asyncLoadImgs(response.data);
            },

            editItem: function () {
                //create editView in dialog here
                new EditView({ collection: this.collection });
            },

            createItem: function () {
                //create editView in dialog here
                new CreateView();
            },
            updateSequence: function (item, workflow, sequence, workflowStart, sequenceStart) {
                if (workflow == workflowStart) {
                    if (sequence > sequenceStart)
                        sequence -= 1;
                    var a = sequenceStart;
                    var b = sequence;
                    var inc = -1;
                    if (a > b) {
                        a = sequence;
                        b = sequenceStart;
                        inc = 1;
                    }
                    $("#" + workflow).find(".item").each(function () {
                        var sec = parseInt($(this).find(".inner").attr("data-sequence"));
                        if (sec >= a && sec <= b)
                            $(this).find(".inner").attr("data-sequence", sec + inc);
                    });
                    item.find(".inner").attr("data-sequence", sequence);

                } else {
                    $("#" + workflow).find(".item").each(function () {
                        if (parseInt($(this).find(".inner").attr("data-sequence")) >= sequence)
                            $(this).find(".inner").attr("data-sequence", parseInt($(this).find(".inner").attr("data-sequence")) + 1);
                    });
                    $("#" + workflowStart).find(".item").each(function () {
                        if (parseInt($(this).find(".inner").attr("data-sequence")) > sequenceStart)
                            $(this).find(".inner").attr("data-sequence", parseInt($(this).find(".inner").attr("data-sequence")) - 1);
                    });
                    item.find(".inner").attr("data-sequence", sequence);

                }
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
                    var total = " <span><span class='totalCount'>" + itemCount + "</span> </span>";
                    column.find(".columnNameDiv h2").append(total);
                }, this);
                populate.getPriority("#priority", this);

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
                        var id = ui.item.context.id;
                        var model = collection.get(id);
                        var column = ui.item.closest(".column");
                        column.find(".counter").html(parseInt(column.find(".counter").html()) - 1);
                        column.find(".totalCount").html(parseInt(column.find(".totalCount").html()) - 1);
                        column.find(".remaining").html(parseInt(column.find(".remaining").html()) - parseInt(model.get('remaining')));
                    },

                    stop: function (event, ui) {
                        var id = ui.item.context.id;
                        var model = collection.get(id);
                        var column = ui.item.closest(".column");
                        var sequence = 0;
                        if (ui.item.next().hasClass("item")) {
                            sequence = parseInt(ui.item.next().find(".inner").attr("data-sequence")) + 1;
                        }
                        if (model) {
                            var secStart = parseInt($(".inner[data-id='" + model.toJSON()._id + "']").attr("data-sequence"));
                            var workStart = model.toJSON().workflow._id ? model.toJSON().workflow._id : model.toJSON().workflow;
                            model.save({
                                workflow: column.attr('id'),
                                sequenceStart: parseInt($(".inner[data-id='" + model.toJSON()._id + "']").attr("data-sequence")),
                                sequence: sequence,
                                workflowStart: model.toJSON().workflow._id ? model.toJSON().workflow._id : model.toJSON().workflow
                            },
                            {
                                patch: true,
                                validate: false,
                                success: function (model2) {
                                    self.updateSequence(ui.item, column.attr("id"), sequence, workStart, secStart);

                                    collection.add(model2, { merge: true });
                                }
                            });
                            column.find(".counter").html(parseInt(column.find(".counter").html()) + 1);
                            column.find(".totalCount").html(parseInt(column.find(".totalCount").html()) + 1);
                            column.find(".remaining").html(parseInt(column.find(".remaining").html()) + parseInt(model.get('remaining')));
                        }
                    }
                }).disableSelection();
                this.$el.append("<div id='timeRecivingDataFromServer'>Created in " + (new Date() - this.startTime) + " ms</div>");
                $(document).on("keypress", "#cPerPage", this.isNumberKey);
				this.$el.unbind();
                return this;
            }
        });

        return TasksKanbanView;
    });
