define([
    'text!templates/Companies/list/ListHeader.html',
    'views/Companies/CreateView',
    'views/Companies/list/ListItemView',
    'text!templates/Alpabet/AphabeticTemplate.html',
    'collections/Companies/filterCollection',
    'common',
    'dataService'
],

function (listTemplate, createView, listItemView, aphabeticTemplate, contentCollection, common, dataService) {
    var CompaniesListView = Backbone.View.extend({
        el: '#content-holder',
        defaultItemsNumber: null,
        listLength: null,
        filter: null,
        newCollection: null,
        page: null,
        contentType: 'Companies',
        viewType: 'list',

        initialize: function (options) {
            this.startTime = options.startTime;
            this.collection = options.collection;
            _.bind(this.collection.showMore, this.collection);
            _.bind(this.collection.showMoreAlphabet, this.collection);
            this.allAlphabeticArray = common.buildAllAphabeticArray();
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
            "click  .list td:not(.notForm)": "gotoForm",
            "click #itemsButton": "itemsNumber",
            "click .currentPageList": "itemsNumber",
            "click": "hideItemsNumber",
            "click .letter:not(.empty)": "alpabeticalRender",
            "click #firstShowPage": "firstPage",
            "click #lastShowPage": "lastPage",
            "click .oe_sortable": "goSort"
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

        renderContent: function () {
                var currentEl = this.$el;
                var tBody = currentEl.find('#listTable');
                tBody.empty();
                $("#top-bar-deleteBtn").hide();
                $('#check_all').prop('checked', false);
                var itemView = new listItemView({ collection: this.collection, page: this.page, itemsNumber: this.collection.namberToShow });
                tBody.append(itemView.render());
                var pagenation = this.$el.find('.pagination');
                if (this.collection.length === 0) {
                    pagenation.hide();
                } else {
                    pagenation.show();
                }
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

        alpabeticalRender: function (e) {
            this.startTime = new Date();
            $(e.target).parent().find(".current").removeClass("current");
            $(e.target).addClass("current");
            var selectedLetter = $(e.target).text();
            if ($(e.target).text() == "All") {
                selectedLetter = "";
            }
            this.filter = (this.filter && this.filter !== 'empty') ? this.filter : {};
            this.filter['letter'] = selectedLetter;
            var itemsNumber = $("#itemsNumber").text();
            $("#top-bar-deleteBtn").hide();
            $('#check_all').prop('checked', false);
            this.changeLocationHash(1, itemsNumber, this.filter);
            this.collection.showMore({ count: itemsNumber, page: 1, filter: this.filter });
            this.getTotalLength(null, itemsNumber, this.filter);
        },

        hideItemsNumber: function (e) {
            $(".allNumberPerPage").hide();
        },

        itemsNumber: function (e) {
            $(e.target).closest("button").next("ul").toggle();
            return false;
        },

        getTotalLength: function (currentNumber, itemsNumber, filter) {
            dataService.getData('/totalCollectionLength/Companies', {
                currentNumber: currentNumber,
                filter: filter,
                newCollection: this.newCollection
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

        render: function () {
            $('.ui-dialog ').remove();
            var self = this;
            var currentEl = this.$el;
            currentEl.html('');
            currentEl.append(_.template(listTemplate));
            currentEl.append(new listItemView({ collection: this.collection, page: this.page, itemsNumber: this.collection.namberToShow }).render());
            $('#check_all').click(function () {
                $(':checkbox').prop('checked', this.checked);
                if ($("input.checkbox:checked").length > 0)
                    $("#top-bar-deleteBtn").show();
                else
                    $("#top-bar-deleteBtn").hide();
            });


            $(document).on("click", function () {
                self.hideItemsNumber();
            });

            common.buildAphabeticArray(this.collection, function (arr) {
                $("#startLetter").remove();
                self.alphabeticArray = arr;
                currentEl.prepend(_.template(aphabeticTemplate, { alphabeticArray: self.alphabeticArray, selectedLetter: (self.selectedLetter == "" ? "All" : self.selectedLetter), allAlphabeticArray: self.allAlphabeticArray }));
                var currentLetter = (self.filter) ? self.filter.letter : null
                if (currentLetter) {
                    $('#startLetter a').each(function () {
                        var target = $(this);
                        if (target.text() == currentLetter) {
                            target.addClass("current");
                        }
                    });
                }
            });
            var pagenation = this.$el.find('.pagination');
            if (this.collection.length === 0) {
                pagenation.hide();
            } else {
                pagenation.show();
            }
            currentEl.append("<div id='timeRecivingDataFromServer'>Created in " + (new Date() - this.startTime) + " ms</div>");
        },

        previousPage: function (event) {
            event.preventDefault();
            $("#top-bar-deleteBtn").hide();
            $('#check_all').prop('checked', false);
            this.prevP({
                sort: this.sort,
                filter: this.filter,
                newCollection: this.newCollection
            });
            dataService.getData('/totalCollectionLength/Companies', {
                filter: this.filter,
                newCollection: this.newCollection,
            }, function (response, context) {
                context.listLength = response.count || 0;
            }, this);
        },

        nextPage: function (event) {
            event.preventDefault();
            $("#top-bar-deleteBtn").hide();
            $('#check_all').prop('checked', false);
            this.nextP({
                sort: this.sort,
                filter: this.filter,
                newCollection: this.newCollection,
            });
            dataService.getData('/totalCollectionLength/Companies', {
                filter: this.filter,
                newCollection: this.newCollection,
            }, function (response, context) {
                context.listLength = response.count || 0;
            }, this);
        },

        firstPage: function (event) {
            event.preventDefault();
            $("#top-bar-deleteBtn").hide();
            $('#check_all').prop('checked', false);
            this.firstP({
                sort: this.sort,
                filter: this.filter,
                newCollection: this.newCollection
            });
            dataService.getData('/totalCollectionLength/Companies', {
                sort: this.sort,
                filter: this.filter
            }, function (response, context) {
                context.listLength = response.count || 0;
            }, this);
        },

        lastPage: function (event) {
            event.preventDefault();
            $("#top-bar-deleteBtn").hide();
            $('#check_all').prop('checked', false);
            this.lastP({
                sort: this.sort,
                filter: this.filter,
                newCollection: this.newCollection
            });
            dataService.getData('/totalCollectionLength/Companies', {
                sort: this.sort,
                filter: this.filter
            }, function (response, context) {
                context.listLength = response.count || 0;
            }, this);
        },

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

        showFilteredPage: function (e) {
            this.startTime = new Date();
            this.newCollection = false;

            var selectedLetter = $(e.target).text();
            if ($(e.target).text() == "All") {
                selectedLetter = "";
                this.newCollection = true;
            }
            this.filter = this.filter || {};
            this.filter['letter'] = selectedLetter;
            var itemsNumber = $("#itemsNumber").text();
            $("#top-bar-deleteBtn").hide();
            $('#check_all').prop('checked', false);
            this.changeLocationHash(1, itemsNumber, this.filter);
            this.collection.showMore({ count: itemsNumber, page: 1, filter: this.filter });
            this.getTotalLength(null, itemsNumber, this.filter);
        },

        showPage: function (event) {
            event.preventDefault();
            this.showP(event, { filter: this.filter, newCollection: this.newCollection, sort: this.sort });
        },

        showMoreContent: function (newModels) {
            var holder = this.$el;
            holder.find("#listTable").empty();
            var itemView = new listItemView({ collection: newModels, page: holder.find("#currentShowPage").val(), itemsNumber: holder.find("span#itemsNumber").text() });
            holder.append(itemView.render());
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

        showMoreAlphabet: function (newModels) {
            var holder = this.$el;
            var alphaBet = holder.find('#startLetter');
            var created = holder.find('#timeRecivingDataFromServer');
            this.countPerPage = newModels.length;
            content.remove();
            holder.append(this.template({ collection: newModels.toJSON() }));
            $("#top-bar-deleteBtn").hide();
            $('#check_all').prop('checked', false);
            this.getTotalLength(null, itemsNumber, this.filter);
            created.text("Created in " + (new Date() - this.startTime) + " ms");
            holder.prepend(alphaBet);
            holder.append(created);
        },

        gotoForm: function (e) {
            App.ownContentType = true;
            var id = $(e.target).closest("tr").data("id");
            window.location.hash = "#easyErp/Companies/form/" + id;
        },

        createItem: function () {
            new createView();
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
            $('#check_all').prop('checked', false);
            dataService.getData('/totalCollectionLength/Companies', {
                filter: this.filter,
                newCollection: this.newCollection
            }, function (response, context) {
                context.listLength = response.count || 0;
            }, this);

            this.deleteRender(deleteCounter, deletePage, {
                filter: this.filter,
                newCollection: this.newCollection,
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
            var count = $("#listTable input:checked").length;
            this.collectionLength = this.collection.length;
            $.each($("#listTable input:checked"), function (index, checkbox) {
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
                            var currentEl = that.$el;
                            common.buildAphabeticArray(that.collection, function (arr) {
                                $("#startLetter").remove();
                                that.alphabeticArray = arr;
                                currentEl.prepend(_.template(aphabeticTemplate, { alphabeticArray: that.alphabeticArray, selectedLetter: (that.selectedLetter == "" ? "All" : that.selectedLetter), allAlphabeticArray: that.allAlphabeticArray }));
                                var currentLetter = (that.filter) ? that.filter.letter : null;
                                if (currentLetter) {
                                    $('#startLetter a').each(function () {
                                        var target = $(this);
                                        if (target.text() == currentLetter) {
                                            target.addClass("current");
                                        }
                                    });
                                }
                            });
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
                            that.deleteCounter = localCounter;
                            that.deletePage = $("#currentShowPage").val();
                            that.deleteItemsRender(that.deleteCounter, that.deletePage);

                        }
                    }
                });
            });
        }

    });
    return CompaniesListView;
});