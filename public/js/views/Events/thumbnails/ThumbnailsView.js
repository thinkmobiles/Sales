﻿define([
    "text!templates/Projects/thumbnails/ThumbnailsItemTemplate.html",
    'text!templates/stages.html',
    'views/Projects/EditView',
    'views/Projects/CreateView',
    'dataService',
    'models/ProjectsModel',
    'common',
	'populate'
],

function (thumbnailsItemTemplate, stagesTamplate, editView, createView, dataService, currentModel, common, populate) {
    var ProjectThumbnalView = Backbone.View.extend({
        el: '#content-holder',
        countPerPage: 0,
        template: _.template(thumbnailsItemTemplate),
        newCollection: true,
        filter: null,
        defaultItemsNumber: null,
        contentType: 'Projects',//needs in view.prototype.changeLocationHash
        viewType: 'thumbnails',//needs in view.prototype.changeLocationHash

        initialize: function (options) {
            $(document).off("click");
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.responseObj = {};
            this.asyncLoadImgs(this.collection);
            _.bind(this.collection.showMore, this.collection);
            this.countPerPage = options.collection.length;
            this.stages = [];
            this.filter = options.filter;
            this.defaultItemsNumber = this.collection.namberToShow || 50;
            this.newCollection = options.newCollection;
            this.deleteCounter = 0;
            this.render();
            this.getTotalLength(this.defaultItemsNumber, this.filter);
        },

        events: {
            "click #showMore": "showMore",
            "click .thumbnail": "gotoEditForm",
            "click .filterButton": "showfilter",
            "click .health-wrapper .health-container": "showHealthDd",
            "click .health-wrapper ul li div": "chooseHealthDd",
            "click .stageSelect": "showNewSelect",
            "click .newSelectList li": "chooseOption",
            "click": "hideHealth",
            "click .filter-check-list li": "checkCheckbox"
        },
        checkCheckbox: function (e) {
            var target$ = $(e.target);
            if (!target$.is("input")) {
                target$.closest("li").find("input").prop("checked", !target$.closest("li").find("input").prop("checked"));
            }
        },
        showNewSelect: function (e) {
            if ($(".newSelectList").is(":visible")) {
                this.hideHealth();
                return false;
            } else {
                $(e.target).parent().append(_.template(stagesTamplate, { stagesCollection: this.stages }));
                return false;
            }
        },

        chooseOption: function (e) {
            var self = this;
            var targetElement = $(e.target).parents(".thumbnail");
            var id = targetElement.attr("id");
            var model = this.collection.get(id);
            model.save({ workflow: $(e.target).attr("id") }, {
                headers:
                {
                    mid: 39
                },
                patch: true,
                validate: false,
                success: function () {
                    self.showFilteredPage();
                }
            });

            this.hideHealth();
            return false;
        },
        chooseHealthDd: function (e) {
            var target$ = $(e.target);
            var target = target$.parents(".health-wrapper");
            var currTargHelth = target$.attr("class").replace("health", "");
            target.find(".health-container a").attr("class", target$.attr("class")).attr("data-value", currTargHelth);
            var id = target.parents(".thumbnail").attr("id");
            var model = this.collection.get(id);
            var helth = parseInt(currTargHelth);
            model.save({ health: helth }, {
                headers:
                {
                    mid: 39
                },
                patch: true,
                validate: false,
                success: function () {
                    $(".health-wrapper ul").hide();
                }
            });
        },

        hideHealth: function () {
            $(".health-wrapper ul").hide();
            $(".newSelectList").hide();
        },
        showHealthDd: function (e) {
            $(e.target).parents(".health-wrapper").find("ul").toggle();
            return false;
        },
        showfilter: function (e) {
            $(".filter-check-list").toggle();
            return false;
        },

        hide: function (e) {
            if (!$(e.target).closest(".filter-check-list").length) {
                $(".allNumberPerPage").hide();
                if ($(".filter-check-list").is(":visible")) {
                    $(".filter-check-list").hide();
                    this.showFilteredPage();
                }
            }

        },

        showFilteredPage: function () {
            this.$el.find('.thumbnail').remove();
            this.startTime = new Date();
            this.newCollection = false;
            var workflowIdArray = [];
            $('.filter-check-list input:checked').each(function () {
                workflowIdArray.push($(this).val());
            });
            this.filter = (this.filter && this.filter !== 'empty') ? this.filter : {};
            this.filter['workflow'] = workflowIdArray;
            this.defaultItemsNumber = 0;
            this.changeLocationHash(null, this.defaultItemsNumber, this.filter);
            this.collection.showMore({ count: this.defaultItemsNumber, page: 1, filter: this.filter });
            this.getTotalLength(this.defaultItemsNumber, this.filter);
        },
        getTotalLength: function (currentNumber, filter, newCollection) {
            dataService.getData('/totalCollectionLength/Projects', { currentNumber: currentNumber, filter: this.filter, newCollection: this.newCollection }, function (response, context) {
                var showMore = context.$el.find('#showMoreDiv');
                if (response.showMore) {
                    if (showMore.length === 0) {
                        var created = context.$el.find('#timeRecivingDataFromServer');
                        created.before('<div id="showMoreDiv"><input type="button" id="showMore" value="Show More"/></div>');
                    } else {
                        showMore.show();
                    }
                } else {
                    showMore.hide();
                }
            }, this);
        },

        asyncLoadImgs: function (collection) {
            var arr = _.filter(collection.toJSON(), function (item) {
                return item.projectmanager !== null;
            });
            var ids = _.map(arr, function (item) {
                return item.projectmanager._id;
            });
            common.getImages(ids, "/getEmployeesImages");
        },
        pushStages: function (stages) {
            this.stages = stages;
        },
        render: function () {
            var self = this;
            var currentEl = this.$el;
            var createdInTag = "<div id='timeRecivingDataFromServer'>Created in " + (new Date() - this.startTime) + " ms</div>";

            currentEl.html('');
                $('#check_all').click(function () {
                    $(':checkbox').prop('checked', this.checked);
                    if ($("input.checkbox:checked").length > 0)
                        $("#top-bar-deleteBtn").show();
                    else
                        $("#top-bar-deleteBtn").hide();
                });
            if (this.collection.length > 0) {
                currentEl.append(this.template({ collection: this.collection.toJSON() }));
            } else {
                currentEl.append('<div class="filterButton"><span class="text">Stage</span><div class="arrow">7</div></div><ul class="filter-check-list"><li><input type="checkbox"  value="null" checked="checked"><span>Undefinded</span></li></ul>');
            }
            this.bind('incomingStages', this.pushStages, this);
            common.populateWorkflowsList("Projects", ".filter-check-list", "", "/Workflows", null, function (stages) {
                var stage = (self.filter) ? self.filter.workflow || [] : [];
                if (self.filter && stage) {
                    $('.filter-check-list input').each(function () {
                        var target = $(this);
                        target.attr('checked', $.inArray(target.val(), stage) > -1);
                    });
                }
                self.trigger('incomingStages', stages);
            });
                $('#check_all').click(function () {
                    $(':checkbox').prop('checked', this.checked);
                    if ($("input.checkbox:checked").length > 0)
                        $("#top-bar-deleteBtn").show();
                    else
                        $("#top-bar-deleteBtn").hide();
                });
            currentEl.append(createdInTag);
            $(document).on("click", function (e) {
                self.hide(e);
                self.hideHealth(e);
            });
            populate.getPriority("#priority", this);
            return this;
        },

        gotoEditForm: function (e) {
            var clas = $(e.target).parent().attr("class");
            if ((clas === "dropDown") || (clas === "inner")) {
            } else {
                e.preventDefault();
                var id = $(e.target).closest('.thumbnail').attr("id");
                var model = new currentModel({ validate: false });
                model.urlRoot = '/Projects/form/' + id;
                model.fetch({
                    success: function (model) {
                        new editView({ model: model });
                    },
                    error: function () { alert('Please refresh browser'); }
                });
            }
        },

        showMore: function (event) {
            event.preventDefault();
            this.collection.showMore({ filter: this.filter, newCollection: this.newCollection });
        },
        showMoreContent: function (newModels) {
            var holder = this.$el;
            var showMore = holder.find('#showMoreDiv');
            var created = holder.find('#timeRecivingDataFromServer');
            var content = holder.find(".thumbnailwithavatar");
            this.defaultItemsNumber += newModels.length;
            this.changeLocationHash(null, (this.defaultItemsNumber < 50) ? 50 : this.defaultItemsNumber, this.filter);
            this.getTotalLength(this.defaultItemsNumber, this.filter);

            if (showMore.length != 0) {
                showMore.before(this.template({ collection: this.collection.toJSON() }));
                $(".filter-check-list").eq(1).remove();

                showMore.after(created);
            } else {
                content.html(this.template({ collection: this.collection.toJSON() }));

            }
            this.asyncLoadImgs(newModels);
        },

        createItem: function () {
            //create editView in dialog here
            new createView();
        },

        editItem: function () {
            //create editView in dialog here
            new editView({ collection: this.collection });
        },

        deleteItems: function () {
            var mid = 39,
                model;
            model = this.collection.get(this.$el.attr("id"));
            this.$el.fadeToggle(200, function () {
                model.destroy({
                    headers: {
                        mid: mid
                    }
                });
                $(this).remove();
            });

        }
    });

    return ProjectThumbnalView;
});
