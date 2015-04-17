define([
    "text!templates/Companies/CreateTemplate.html",
    "collections/Companies/CompaniesCollection",
    "collections/Employees/EmployeesCollection",
    "collections/Departments/DepartmentsCollection",
    'views/Assignees/AssigneesView',
    "models/CompaniesModel",
    "common",
	"populate"
],
    function (CreateTemplate, CompaniesCollection, EmployeesCollection, DepartmentsCollection, AssigneesView, CompanyModel, common, populate) {

        var CreateView = Backbone.View.extend({
            el: "#content-holder",
            contentType: "Companies",
            template: _.template(CreateTemplate),
            imageSrc: '',
            initialize: function () {
                _.bindAll(this, "saveItem", "render");
                this.model = new CompanyModel();
				this.responseObj = {};
                this.render();
            },

            events: {
                "click #tabList a": "switchTab",
                "mouseenter .avatar": "showEdit",
                "mouseleave .avatar": "hideEdit",
                "click .details": "toggleDetails",
                'keydown': 'keydownHandler',
                'click .dialog-tabs a': 'changeTab',
                "click .newSelectList li:not(.miniStylePagination)": "chooseOption",
                "click .newSelectList li.miniStylePagination": "notHide",
                "click .newSelectList li.miniStylePagination .next:not(.disabled)": "nextSelect",
                "click .newSelectList li.miniStylePagination .prev:not(.disabled)": "prevSelect",
                "click .current-selected": "showNewSelect",
                "click": "hideNewSelect"

            },
			notHide: function () {
				return false;
            },
            hideNewSelect: function () {
                $(".newSelectList").hide();
            },
			nextSelect:function(e){
				this.showNewSelect(e,false,true);
			},
			prevSelect:function(e){
				this.showNewSelect(e,true,false);
			},
            showNewSelect:function(e,prev,next){
                populate.showSelect(e,prev,next,this);
                return false;
            },
			chooseOption:function(e){
                $(e.target).parents("dd").find(".current-selected").text($(e.target).text()).attr("data-id",$(e.target).attr("id"));
			},
            keydownHandler: function(e){
                switch (e.which){
                    case 27:
                        this.hideDialog();
                        break;
                    default:
                        break;
                }
            },

            changeTab:function(e){
                var holder = $(e.target);
                holder.closest(".dialog-tabs").find("a.active").removeClass("active");
                holder.addClass("active");
                var n = holder.parents(".dialog-tabs").find("li").index(holder.parent());
                var dialog_holder = $(".dialog-tabs-items");
                dialog_holder.find(".dialog-tabs-item.active").removeClass("active");
                dialog_holder.find(".dialog-tabs-item").eq(n).addClass("active");
            },

			toggleDetails:function(){
				$("#details-dialog").toggle();
			},
            switchTab: function (e) {
                e.preventDefault();
                var link = this.$("#tabList a");
                if (link.hasClass("selected")) {
                    link.removeClass("selected");
                }
                var index = link.index($(e.target).addClass("selected"));
                this.$(".tab").hide().eq(index).show();
            },
            showEdit: function () {
                $(".upload").animate({
                    height: "20px",
                    display: "block"
                }, 250);

            },
            hideEdit: function () {
                $(".upload").animate({
                    height: "0px",
                    display: "block"
                }, 250);

            },
            hideDialog: function () {
                $(".create-dialog").remove();
                $(".add-group-dialog").remove();
                $(".add-user-dialog").remove();
                $(".crop-images-dialog").remove();
            },

            saveItem: function () {
                var self = this;
                var mid = 39;
                var companyModel = new CompanyModel();
                var name = {
                    first: $.trim(this.$el.find("#name").val()),
                    last:''
                };
                var address = {};
                this.$el.find(".person-info").find(".address").each(function () {
                    var el = $(this);
                    address[el.attr("name")] = $.trim(el.val());
                });
                var email = $.trim(this.$el.find("#email").val());
                var phone = $.trim(this.$el.find("#phone").val());
                var mobile = $.trim(this.$el.find("#mobile").val());
                var fax = $.trim(this.$el.find("#fax").val());
                var website = $.trim(this.$el.find("#website").val().replace('http://', ''));
                var internalNotes = $.trim(this.$el.find("#internalNotes").val());
                var salesPerson = this.$("#employeesDd").data("id");
                var salesTeam = this.$("#departmentDd").data("id");
                var reference = $.trim(this.$el.find("#reference").val());
                var language = $.trim(this.$el.find("#language").text());
                var isCustomer = (this.$el.find("#isCustomer").is(":checked")) ? true : false;
                var isSupplier = (this.$el.find("#isSupplier").is(":checked")) ? true : false;
                var active = (this.$el.find("#active").is(":checked")) ? true : false;
                var usersId=[];
                var groupsId=[];
                $(".groupsAndUser tr").each(function(){
                    if ($(this).data("type")=="targetUsers"){
                        usersId.push($(this).data("id"));
                    }
                    if ($(this).data("type")=="targetGroups"){
                        groupsId.push($(this).data("id"));
                    }

                });
                var whoCanRW = this.$el.find("[name='whoCanRW']:checked").val();
                companyModel.save({
                    name: name,
                    imageSrc: this.imageSrc,
                    email: email,
                    phones: {
                        phone: phone,
                        mobile: mobile,
                        fax: fax
                    },
                    address: address,
                    website: website,
                    internalNotes: internalNotes,
                    salesPurchases: {
                        isCustomer: isCustomer,
                        isSupplier: isSupplier,
                        active: active,
                        salesPerson: salesPerson,
                        salesTeam: salesTeam,
                        reference: reference,
                        language: language
                    },
                    groups: {
                        owner: $("#allUsersSelect").data("id"),
                        users: usersId,
                        group: groupsId
                    },
                    whoCanRW: whoCanRW
                },
                    {
                        headers: {
                            mid: mid
                        },
                        wait: true,
                        success: function () {
							self.hideDialog();
							Backbone.history.navigate("easyErp/Companies", { trigger: true });
                        },
                        error: function (models, xhr) {
							self.errorNotification(xhr);
						}
                    });
            },

            render: function () {
                var companyModel = new CompanyModel();
                var formString = this.template({});
				var self = this;
                this.$el = $(formString).dialog({
					closeOnEscape: false,
                    autoOpen:true,
                    resizable:true,
					dialogClass:"create-dialog",
					title: "Create Company",
					width:"80%",
                    buttons: [
                        {
                            text: "Create",
                            click: function () {
                                self.saveItem();
                            }
                        },
						{
						    text: "Cancel",
						    click: function () {
                                self.hideDialog();
                            }
						}]

                });
				var notDiv = this.$el.find('.assignees-container');
                notDiv.append(
                    new AssigneesView({
                        model: this.currentModel,
                    }).render().el
                );
				populate.get("#departmentDd", "/DepartmentsForDd",{},"departmentName",this,true,true);
				populate.get("#language", "/Languages",{},"name",this,true,false);
				populate.get2name("#employeesDd", "/getSalesPerson",{},this,true,true);
                common.canvasDraw({ model: companyModel.toJSON() }, this);
                this.$el.find('#date').datepicker({
                    dateFormat: "d M, yy",
                    changeMonth: true,
                    changeYear: true,
                    yearRange: '-100y:c+nn',
                    maxDate: '-18y'
                });
                this.delegateEvents(this.events);
                return this;
            }
        });
        return CreateView;
    });