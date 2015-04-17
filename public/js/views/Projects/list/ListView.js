define([
    'text!templates/Projects/list/ListHeader.html',
    'text!templates/stages.html',
    'views/Projects/CreateView',
    'views/Projects/list/ListItemView',
    'views/Projects/EditView',
    'models/ProjectsModel',
    'collections/Projects/filterCollection',
    'common',
    'dataService'
],

    function (listTemplate, stagesTamplate, CreateView, listItemView, editView, currentModel, contentCollection, common, dataService) {
        var ProjectsListView = Backbone.View.extend({
            el: '#content-holder',
            defaultItemsNumber: null,
            listLength: null,
            filter: null,
            sort: null,
            newCollection: null,
            page: null, //if reload page, and in url is valid page
            contentType: 'Projects',//needs in view.prototype.changeLocationHash
            viewType: 'list',//needs in view.prototype.changeLocationHash

            initialize: function (options) {
                $(document).off("click");
                this.startTime = options.startTime;
                this.collection = options.collection;
                _.bind(this.collection.showMore, this.collection);
                this.parrentContentId = options.collection.parrentContentId;
                this.stages = [];
                this.sort = options.sort;
                this.filter = options.filter;
                this.defaultItemsNumber = this.collection.namberToShow || 50;
                this.newCollection = options.newCollection;
                this.deleteCounter = 0;
                this.page = options.collection.page;
                this.render();
                this.getTotalLength(null, this.defaultItemsNumber, this.filter);
                this.contentCollection = contentCollection;
            },

            events: {
                "click .itemsNumber": "switchPageCounter",
                "click .showPage": "showPage",
                "change #currentShowPage": "showPage",
                "click #previousPage": "previousPage",
                "click #nextPage": "nextPage",
                "click .checkbox": "checked",
                "click #itemsButton": "itemsNumber",
                "click .currentPageList": "itemsNumber",
                "click": "hideItemsNumber",
                "click .filterButton": "showfilter",
                "click .filter-check-list li": "checkCheckbox",
                "click .stageSelect": "showNewSelect",
                "click .newSelectList li": "chooseOption",
                "click #health .health-container": "showHealthDd",
                "click #health ul li div": "chooseHealthDd",
                "click td:not(:has('input[type='checkbox']'))": "goToEditDialog",
                "click .oe_sortable": "goSort",
                "click #firstShowPage": "firstPage",
                "click #lastShowPage": "lastPage",
            },

            fetchSortCollection: function (sortObject) {
                this.sort = sortObject;
                this.collection = new contentCollection({
                    viewType: 'list',
                    sort: sortObject,
                    page: this.page,
                    count: this.defaultItemsNumber,
                    filter: this.filter,
                    parrentContentId: this.parrentContentId,
                    contentType: this.contentType,
                    newCollection: this.newCollection
                });
                this.collection.bind('reset', this.renderContent, this);
                this.collection.bind('showmore', this.showMoreContent, this);
            },

            goSort: function (e) {
                this.collection.unbind('reset');
                this.collection.unbind('showmore');
                var target$ = $(e.target);
                var currentParrentSortClass = target$.attr('class');
                var sortClass = currentParrentSortClass.split(' ')[1];
                var sortConst = 1;
                var sortBy = target$.data('sort');
                var sortObject = {};
                if (!sortClass) {
                    target$.addClass('sortDn');
                    sortClass = "sortDn";
                }
                switch (sortClass) {
                    case "sortDn":
                        {
                            target$.parent().find("th").removeClass('sortDn').removeClass('sortUp');
                            target$.removeClass('sortDn').addClass('sortUp');
                            sortConst = 1;
                        }
                        break;
                    case "sortUp":
                        {
                            target$.parent().find("th").removeClass('sortDn').removeClass('sortUp');
                            target$.removeClass('sortUp').addClass('sortDn');
                            sortConst = -1;
                        }
                        break;
                }
                sortObject[sortBy] = sortConst;
                this.fetchSortCollection(sortObject);
                this.changeLocationHash(1, this.defaultItemsNumber);
                this.getTotalLength(null, this.defaultItemsNumber, this.filter);
            },

            goToEditDialog: function (e) {
                e.preventDefault();
                var id = $(e.target).closest('tr').data("id");
                var model = new currentModel({ validate: false });
                model.urlRoot = '/Projects/form/' + id;
                model.fetch({
                    success: function (model) {
                        new editView({ model: model });
                    },
                    error: function () { alert('Please refresh browser'); }
                });
            },

            checkCheckbox: function (e) {
                var target$ = $(e.target);
                if (!target$.is("input")) {
                    target$.closest("li").find("input").prop("checked", !target$.closest("li").find("input").prop("checked"));
                }
            },

            chooseHealthDd: function (e) {
                var target$ = $(e.target);
                var target = target$.parents("#health");
                target.find("div a").attr("class", target$.attr("class")).attr("data-value", target$.attr("class").replace("health", "")).parents("#health").find("ul").toggle();
                var id = target.data("id");
                var model = this.collection.get(id);
                model.save({ health: target.find("div a").data("value") }, {
                    headers:
                        {
                            mid: 39
                        },
                    patch: true,
                    validate: false,
                    success: function () {
                        target$.parents("#health").find("ul").hide();
                    }
                });
                return false;

            },

            showHealthDd: function (e) {
                $(e.target).parents("#health").find("ul").toggle();
                return false;
            },

            getTotalLength: function (currentNumber, itemsNumber, filter) {
                dataService.getData('/totalCollectionLength/Projects', {
                    type: 'Projects',
                    currentNumber: currentNumber,
                    filter: filter,
                    newCollection: this.newCollection,
                    parrentContentId: this.parrentContentId
                }, function (response, context) {
                    var page = context.page || 1;
                    var length = context.listLength = response.count || 0;
                    if (itemsNumber * (page - 1) > length) {
                        context.page = page = Math.ceil(length / itemsNumber);
                        context.fetchSortCollection(context.sort);
                        context.changeLocationHash(page, context.defaultItemsNumber, filter);
                    }
                    context.pageElementRender(response.count, itemsNumber, page);//prototype in main.js
                }, this);
            },

            hideNewSelect: function (e) {
                $(".newSelectList").remove();
            },

            showNewSelect: function (e) {
                if ($(".newSelectList").is(":visible")) {
                    this.hideNewSelect();
                    return false;
                } else {
                    $(e.target).parent().append(_.template(stagesTamplate, { stagesCollection: this.stages }));
                    return false;
                }
            },

            chooseOption: function (e) {
                var self = this;
                var target$ = $(e.target);
                var targetElement = target$.parents("td");
                var id = targetElement.attr("id");
                var model = this.collection.get(id);
                model.save({ workflow: target$.attr("id") }, {
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

                this.hideNewSelect();
                return false;
            },

            showFilteredPage: function () {
                this.startTime = new Date();
                this.newCollection = false;
                var workflowIdArray = [];
                $('.filter-check-list input:checked').each(function () {
                    workflowIdArray.push($(this).val());
                });
                this.filter = this.filter || {};
                this.filter['workflow'] = workflowIdArray;
                var itemsNumber = $("#itemsNumber").text();
                $("#top-bar-deleteBtn").hide();
                $('#check_all').prop('checked', false);
                this.changeLocationHash(1, itemsNumber, this.filter);
                this.collection.showMore({ count: itemsNumber, page: 1, filter: this.filter });
                this.getTotalLength(null, itemsNumber, this.filter);
            },

            showfilter: function (e) {
                $(".filter-check-list").toggle();
                return false;
            },

            pushStages: function (stages) {
                this.stages = stages;
            },

            hideItemsNumber: function (e) {
                $(".allNumberPerPage").hide();
                $("#health ul").hide();
                $(".newSelectList").hide();
                if (!$(e.target).closest(".filter-check-list").length) {
                    $(".allNumberPerPage").hide();
                    if ($(".filter-check-list").is(":visible")) {
                        $(".filter-check-list").hide();
                        this.showFilteredPage();
                    }
                }

            },

            itemsNumber: function (e) {
                $(e.target).closest("button").next("ul").toggle();
                return false;
            },

            previousPage: function (event) {
                $("#top-bar-deleteBtn").hide();
                $('#check_all').prop('checked', false);
                event.preventDefault();
                this.prevP({
                    sort: this.sort,
                    filter: this.filter,
                    newCollection: this.newCollection,
                    parrentContentId: this.parrentContentId
                });
                dataService.getData('/totalCollectionLength/Projects', {
                    type: 'Projects',
                    filter: this.filter,
                    newCollection: this.newCollection,
                    parrentContentId: this.parrentContentId
                }, function (response, context) {
                    context.listLength = response.count || 0;
                }, this);
            },

            nextPage: function (event) {
                $("#top-bar-deleteBtn").hide();
                $('#check_all').prop('checked', false);
                event.preventDefault();
                this.nextP({
                    sort: this.sort,
                    filter: this.filter,
                    newCollection: this.newCollection,
                    parrentContentId: this.parrentContentId
                });
                dataService.getData('/totalCollectionLength/Projects', {
                    type: 'Projects',
                    filter: this.filter,
                    newCollection: this.newCollection,
                    parrentContentId: this.parrentContentId
                }, function (response, context) {
                    context.listLength = response.count || 0;
                }, this);
            },

            firstPage: function (event) {
                $("#top-bar-deleteBtn").hide();
                $('#check_all').prop('checked', false);
                event.preventDefault();
                this.firstP({
                    sort: this.sort,
                    filter: this.filter,
                    newCollection: this.newCollection
                });
                dataService.getData('/totalCollectionLength/Projects', {
                    type: 'Projects',
                    filter: this.filter,
                    newCollection: this.newCollection
                }, function (response, context) {
                    context.listLength = response.count || 0;
                }, this);
            },

            lastPage: function (event) {
                $("#top-bar-deleteBtn").hide();
                $('#check_all').prop('checked', false);
                event.preventDefault();
                this.lastP({
                    sort: this.sort,
                    filter: this.filter,
                    newCollection: this.newCollection
                });
                dataService.getData('/totalCollectionLength/Projects', {
                    type: 'Projects',
                    filter: this.filter,
                    newCollection: this.newCollection
                }, function (response, context) {
                    context.listLength = response.count || 0;
                }, this);
            },  //end first last page in paginations
            //modified for filter Vasya
            switchPageCounter: function (event) {
                event.preventDefault();
                this.startTime = new Date();
                var itemsNumber = event.target.textContent;
                this.defaultItemsNumber = itemsNumber;
                this.getTotalLength(null, itemsNumber, this.filter);
                this.collection.showMore({
                    count: itemsNumber,
                    page: 1,
                    filter: this.filter,
                    newCollection: this.newCollection
                });
                this.page = 1;
                $("#top-bar-deleteBtn").hide();
                $('#check_all').prop('checked', false);
                this.changeLocationHash(1, itemsNumber, this.filter);
            },

            showPage: function (event) {
                event.preventDefault();
                this.showP(event, { filter: this.filter, newCollection: this.newCollection, sort: this.sort });
            },

            render: function () {
                var self = this;
                $('.ui-dialog ').remove();
                var currentEl = this.$el;
                currentEl.html('');

                currentEl.append(_.template(listTemplate));
                var itemView = new listItemView({ collection: this.collection, page: this.page, itemsNumber: this.collection.namberToShow });
                itemView.bind('incomingStages', this.pushStages, this);

                currentEl.append(itemView.render());//added two parameters page and items number
                $('#check_all').click(function () {
                    $(':checkbox').prop('checked', this.checked);
                    if ($("input.checkbox:checked").length > 0)
                        $("#top-bar-deleteBtn").show();
                    else
                        $("#top-bar-deleteBtn").hide();
                });

                common.populateWorkflowsList("Projects", ".filter-check-list", "", "/Workflows", null, function (stages) {
                    var stage = (self.filter) ? self.filter.workflow || [] : [];
                    if (self.filter && stage) {
                        $('.filter-check-list input').each(function () {
                            var target = $(this);
                            target.attr('checked', $.inArray(target.val(), stage) > -1);
                        });
                    }
                    itemView.trigger('incomingStages', stages);
                });

                $(document).on("click", function (e) {
                    self.hideItemsNumber(e);
                });
                var pagenation = this.$el.find('.pagination');
                if (this.collection.length === 0) {
                    pagenation.hide();
                } else {
                    pagenation.show();
                }
                currentEl.append("<div id='timeRecivingDataFromServer'>Created in " + (new Date() - this.startTime) + " ms</div>");
                //this.renderContent();
            },

            renderContent: function () {
                var currentEl = this.$el;
                var tBody = currentEl.find('#listTable');
                $("#top-bar-deleteBtn").hide();
                $('#check_all').prop('checked', false);
                tBody.empty();
                var itemView = new listItemView({ collection: this.collection, page: currentEl.find("#currentShowPage").val(), itemsNumber: currentEl.find("span#itemsNumber").text() });
                tBody.append(itemView.render());
                var pagenation = this.$el.find('.pagination');
                if (this.collection.length === 0) {
                    pagenation.hide();
                } else {
                    pagenation.show();
                }
            },

            showMoreContent: function (newModels) {
                var holder = this.$el;
                var tBody = holder.find('#listTable');
                tBody.empty();
                var itemView = new listItemView({ collection: newModels, page: holder.find("#currentShowPage").val(), itemsNumber: holder.find("span#itemsNumber").text() });
                tBody.append(itemView.render());
                itemView.undelegateEvents();
                var pagenation = holder.find('.pagination');
                if (newModels.length !== 0) {
                    pagenation.show();
                } else {
                    pagenation.hide();
                }
                $("#top-bar-deleteBtn").hide();
                $('#check_all').prop('checked', false);
                holder.find('#timeRecivingDataFromServer').remove();
                holder.append("<div id='timeRecivingDataFromServer'>Created in " + (new Date() - this.startTime) + " ms</div>");
            },

            gotoForm: function (e) {
                App.ownContentType = true;
                var id = $(e.target).closest("tr").data("id");
                window.location.hash = "#easyErp/Projects/form/" + id;
            },

            createItem: function () {
                //create editView in dialog here
                new CreateView();
            },

            checked: function () {
                if (this.collection.length > 0) {
                    var checkLength = $("input.checkbox:checked").length;
                    if ($("input.checkbox:checked").length > 0) {
                        $("#top-bar-deleteBtn").show();
                        if (checkLength == this.collection.length) {
                            $('#check_all').prop('checked', true);
                        }
                    }
                    else {
                        $("#top-bar-deleteBtn").hide();
                        $('#check_all').prop('checked', false);
                    }
                }
            },

            deleteItemsRender: function (deleteCounter, deletePage) {
                dataService.getData('/totalCollectionLength/Projects', {
                    filter: this.filter,
                    newCollection: this.newCollection
                }, function (response, context) {
                    context.listLength = response.count || 0;
                }, this);
                this.deleteRender(deleteCounter, deletePage, {
                    filter: this.filter,
                    newCollection: this.newCollection
                });

                var pagenation = this.$el.find('.pagination');
                if (this.collection.length === 0) {
                    pagenation.hide();
                } else {
                    pagenation.show();
                }
            },

            deleteItems: function () {
                var that = this;
                var mid = 39;
                var model;
                var localCounter = 0;
                this.collectionLength = this.collection.length;
                var count = $("#listTable input:checked").length;
                $.each($("tbody input:checked"), function (index, checkbox) {
                    model = that.collection.get(checkbox.value);
                    model.destroy({
                        headers: {
                            mid: mid
                        },
                        wait: true,
                        success: function () {
                            that.listLength--;
                            localCounter++;
                            count--;
                            if (count === 0) {
                                that.defaultItemsNumber = $("#itemsNumber").text();
                                that.deleteCounter = localCounter;
                                that.deletePage = $("#currentShowPage").val();
                                that.deleteItemsRender(that.deleteCounter, that.deletePage);

                            }
                        },
                        error: function (model, res) {
                            if (res.status === 403 && index === 0) {
                                alert("You do not have permission to perform this action");
                            }
                            that.listLength--;
                            count--;
                            if (count === 0) {
                                that.defaultItemsNumber = $("#itemsNumber").text();
                                that.deleteCounter = localCounter;
                                that.deletePage = $("#currentShowPage").val();
                                that.deleteItemsRender(that.deleteCounter, that.deletePage);

                            }

                        }
                    });
                });
            }

        });

        return ProjectsListView;
    });
