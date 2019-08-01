(function() {
    'use strict';

    var app = angular.module('app');
    
    app.factory('globalNav', ['$rootScope', '$state', function($rootScope, $state) {
		var nav = {
			FORM_BLANK: "/partials/blank.html",
			FORM_TASK: "/partials/tasks.html",
			FORM_TASK_DETAILS: "/partials/taskDetails.html",
			FORM_PEOPLE: "/partials/people.html",
			FORM_PERSON_DETAILS: "/partials/personDetails.html",
			FORM_PERSON_EDIT: "/partials/personEdit.html",
			FORM_PROJECTS: "/partials/projectDetails.html",
			FORM_PROJECTS_EDIT: "/partials/projectEdit.html",
			FORM_JOURNAL_ENTRY_EDIT: "/partials/journalEntryEdit.html",
			FORM_REMINDER_EDIT: "/partials/reminderEdit.html",
			FORM_TICKET_DETAILS: "/partials/ticketDetails.html",
			FORM_DOCS: "/partials/docs.html",
			FORM_FOLDER_EDIT: "/partials/folderEdit.html",
			activeSideForm: "",
			activeSideEditForm: "",
			activeSideViewForm: "",
			sideFormHidden: true,
			sideEditFormHidden: true,
			sideViewFormHidden: true,
			registerEditCntrl: null,
			registerViewCntrl: null
		};
		
		nav.activeSideForm = nav.FORM_BLANK;
		nav.activeSideEditForm = nav.FORM_BLANK;
		nav.activeSideViewForm = nav.FORM_BLANK;
		
		nav.actionArg = null;
        nav.action = null;
		nav.defaultProject = null;
		nav.defaultPerson = null;
        
        nav.ACTION_TASK = 'ACTION_TASK';
        nav.ACTION_TASK_OPEN_DETAILS = 'ACTION_TASK_OPEN_DETAILS';
        nav.ACTION_TASK_NEW = 'ACTION_TASK_NEW';
        
        nav.ACTION_PEOPLE = 'ACTION_PEOPLE';
        nav.ACTION_PEOPLE_OPEN_DETAILS = 'ACTION_PEOPLE_OPEN_DETAILS';
        nav.ACTION_PEOPLE_OPEN_EDIT = 'ACTION_PEOPLE_OPEN_EDIT';
        nav.ACTION_PEOPLE_NEW = 'ACTION_PEOPLE_NEW';
        
        nav.ACTION_PROJECT = 'ACTION_PROJECT';
        nav.ACTION_PROJECT_OPEN_DETAILS = 'ACTION_PROJECT_OPEN_DETAILS';
		nav.ACTION_PROJECT_NEW = 'ACTION_PROJECT_NEW';
		
		nav.ACTION_FOLDER = 'ACTION_FOLDER';
        nav.ACTION_FOLDER_OPEN_DETAILS = 'ACTION_FOLDER_OPEN_DETAILS';
        nav.ACTION_FOLDER_NEW = 'ACTION_FOLDER_NEW';
        
        nav.ACTION_TICKET = 'ACTION_TICKET';
        nav.ACTION_TICKET_OPEN_DETAILS = 'ACTION_TICKET_OPEN_DETAILS';
        nav.ACTION_TICKET_NEW = 'ACTION_TICKET_NEW';
        
        nav.ACTION_JOURNAL_ENTRY = 'ACTION_JOURNAL_ENTRY';
        nav.ACTION_JOURNAL_ENTRY_EDIT = 'ACTION_JOURNAL_ENTRY_EDIT';
        nav.ACTION_JOURNAL_ENTRY_NEW = 'ACTION_JOURNAL_ENTRY_NEW';
        
        nav.ACTION_REMINDER = 'ACTION_REMINDER';
        nav.ACTION_REMINDER_EDIT = 'ACTION_REMINDER_EDIT';
		nav.ACTION_REMINDER_NEW = 'ACTION_REMINDER_NEW';
		
		nav.ACTION_PREF_FAQ = 'ACTION_PREF_FAQ';
		nav.ACTION_PREF_TEAM = 'ACTION_PREF_TEAM';
        
        nav.hideSideForm = function() {
	        nav.sideFormHidden = true;
	        nav.activeSideForm = this.FORM_BLANK;
        }
        
        nav.hideSideEditForm = function() {
	        nav.sideEditFormHidden = true;
	        nav.activeSideEditForm = this.FORM_BLANK;
        }
        
        nav.hideSideViewForm = function() {
	        nav.sideViewFormHidden = true;
	        nav.activeSideViewForm = this.FORM_BLANK;
        }
        
        nav.hideAll = function() {
	        nav.hideSideForm();
	        nav.hideSideEditForm();
	        nav.hideSideViewForm();
        }
        
		//Browse Actions
		nav.showDocs = function() {
	        nav.hideSideEditForm();
	        nav.hideSideViewForm();
	        
	        nav.sideFormHidden = false;
	        nav.activeSideForm = this.FORM_DOCS;
        }

        nav.showTasks = function() {
	        nav.hideSideEditForm();
	        nav.hideSideViewForm();
	        
	        nav.sideFormHidden = false;
	        nav.activeSideForm = this.FORM_TASK;
        }
        
        nav.showPeople = function() {
	        nav.hideSideEditForm();
	        nav.hideSideViewForm();
	        
	        nav.sideFormHidden = false;
	        nav.activeSideForm = this.FORM_PEOPLE;
        }
        
        //View Actions
        nav.showHelp = function() {
	        nav.hideSideEditForm();
	        
	        nav.sideViewFormHidden = false;
	        nav.activeSideViewForm = "/partials/help.html";
        }
        
        nav.showPref = function() {
	        nav.hideSideEditForm();
	        
	        nav.sideViewFormHidden = false;
	        nav.activeSideViewForm = "/partials/settings.html";
		}

		nav.showPrefFAQs = function() {
	        nav.hideSideEditForm();
	        
	        nav.sideViewFormHidden = false;
	        nav.activeSideViewForm = "/partials/settings.html";
		}
		
		nav.showPrefTag = function() {
	        nav.hideSideEditForm();
	        
	        nav.sideViewFormHidden = false;
	        nav.activeSideViewForm = "/partials/settings_tag.html";
        }
        
        nav.showMyTimeline = function() {
	        nav.hideSideEditForm();
	        
	        nav.sideViewFormHidden = false;
	        nav.activeSideViewForm = "/partials/timeline.html";
        }
        
        //Edit Actions
        nav.showTaskDetails = function() {	        
	        nav.sideEditFormHidden = false;
	        nav.activeSideEditForm = this.FORM_TASK_DETAILS;
        }
        
        nav.showJournalEntryDetails = function() {	        
	        nav.sideEditFormHidden = false;
	        nav.activeSideEditForm = this.FORM_JOURNAL_ENTRY_EDIT;
        }
        
        nav.showReminderDetails = function() {	        
	        nav.sideEditFormHidden = false;
	        nav.activeSideEditForm = this.FORM_REMINDER_EDIT;
        }
        
        //General Actions
        nav.isActiveView = function(formName) {
	        return !this.sideViewFormHidden && this.activeSideViewForm == formName;
        }
        
        nav.isActiveEdit = function(formName) {
	        return !this.sideEditFormHidden && this.activeSideEditForm == formName;
        }
        
        nav.clearEditController = function() {
			if (this.registerEditCntrl != null) {
				this.registerEditCntrl();
				this.registerEditCntrl = null;
			}
		}
		
		nav.clearViewController = function() {
			if (this.registerViewCntrl != null) {
				this.registerViewCntrl();
				this.registerViewCntrl = null;
			}
		}
		
		nav.registerEditController = function(event, funct) {
			this.registerEditCntrl = $rootScope.$on(event, funct);
		}
		
		nav.registerViewController = function(event, funct) {
			this.registerViewCntrl = $rootScope.$on(event, funct);
		}
		
		nav.clearAction = function() {
			 this.actionArg = null;
			 this.action = null;
		}
	
		
		// Project View Actions
		nav.openProjectDetails = function(project) {
			this.clearAction();
			this.actionArg = project;
			this.action = this.ACTION_PROJECT_OPEN_DETAILS;
			
			this.launchProjectDetails();
		}
		
		nav.newProject = function() {
			this.clearAction();
			this.action = this.ACTION_PROJECT_NEW;
			
			this.launchProjectEditDetails();
		}
		
		nav.launchProjectDetails = function() {
			if (this.isActiveView(this.FORM_PROJECTS)){
				$rootScope.$broadcast(this.ACTION_PROJECT);
			} else {
				this.clearViewController();
				this.showProjects();
			}
		}
		
		// Project Edit Actions
		nav.openProjectEditDetails = function(project) {
			this.clearAction();
			this.actionArg = project;
			this.action = this.ACTION_PROJECT_EDIT_DETAILS;
			
			this.launchProjectEditDetails();
		}
		
		nav.launchProjectEditDetails = function() {
			if (this.isActiveEdit(this.FORM_PROJECTS_EDIT)){
				$rootScope.$broadcast(this.ACTION_PROJECT);
			} else {
				this.clearEditController();
				this.showEditProjects();
			}
		}
		
		nav.showEditProjects = function() {
	        nav.sideEditFormHidden = false;
	        nav.activeSideEditForm = this.FORM_PROJECTS_EDIT;
        }
		
		nav.showProjects = function() {
	        nav.sideViewFormHidden = false;
	        nav.activeSideViewForm = this.FORM_PROJECTS;
        }
        
        // Task Edit Actions
        nav.openTaskDetails = function(task) {
			this.clearAction();
			this.actionArg = task;
			this.action = this.ACTION_TASK_OPEN_DETAILS;
			
			this.launchTaskDetails();
		}
		
		nav.newTask = function(projId) {
			this.clearAction();
			this.action = this.ACTION_TASK_NEW;
			this.defaultProject = projId;	
			
			this.launchTaskDetails();
		}

		nav.newTaskForPerson = function(personId) {
			this.clearAction();
			this.action = this.ACTION_TASK_NEW;
			this.defaultPerson = personId;	
			
			this.launchTaskDetails();
		}
        
        nav.launchTaskDetails = function() {
			if (this.isActiveEdit(this.FORM_TASK_DETAILS)){
				$rootScope.$broadcast(this.ACTION_TASK);
			} else {
				this.clearEditController();
				this.showTaskDetails();
			}
		}
		
		// Journal Entry Edit Actions
        nav.openJournalEditDetails = function(journalEntry) {
			this.clearAction();
			this.actionArg = journalEntry;
			this.action = this.ACTION_JOURNAL_ENTRY_EDIT;
			
			this.launchJournalEntryDetails();
		}
		
		nav.newJournalEntry = function() {
			this.clearAction();
			this.action = this.ACTION_JOURNAL_ENTRY_NEW;
			
			this.launchJournalEntryDetails();
		}
        
        nav.launchJournalEntryDetails = function() {
			if (this.isActiveEdit(this.FORM_JOURNAL_ENTRY_EDIT)){
				$rootScope.$broadcast(this.ACTION_JOURNAL_ENTRY);
			} else {
				this.clearEditController();
				this.showJournalEntryDetails();
			}
		}
		
		// Reminder Edit Actions
        nav.openReminderEditDetails = function(reminder) {
			this.clearAction();
			this.actionArg = reminder;
			this.action = this.ACTION_REMINDER_EDIT;
			
			this.launchReminderDetails();
		}
		
		nav.newReminder = function() {
			this.clearAction();
			this.action = this.ACTION_REMINDER_NEW;
			
			this.launchReminderDetails();
		}
        
        nav.launchReminderDetails = function() {
			if (this.isActiveEdit(this.FORM_REMINDER_EDIT)){
				$rootScope.$broadcast(this.ACTION_REMINDER);
			} else {
				this.clearEditController();
				this.showReminderDetails();
			}
		}
		
		// Ticket View Actions
		nav.openTicketDetails = function(ticket) {
			this.clearAction();
			this.actionArg = ticket;
			this.action = this.ACTION_TICKET_OPEN_DETAILS;
			
			this.launchTicketDetails();
		}
		
		nav.launchTicketDetails = function() {
			if (this.isActiveEdit(this.FORM_TICKET_DETAILS)){
				$rootScope.$broadcast(this.ACTION_TICKET);
			} else {
				this.clearEditController();
				this.showTicketDetails();
			}
		}
		
		nav.showTicketDetails = function() {
	        nav.sideEditFormHidden = false;
	        nav.activeSideEditForm = this.FORM_TICKET_DETAILS;
        }
		
		// People View Actions
		nav.openPeopleDetails = function(person) {
			this.clearAction();
			this.actionArg = person;
			this.action = this.ACTION_PEOPLE_OPEN_DETAILS;
			
			this.launchPeopleDetails();
		}
		
		nav.launchPeopleDetails = function() {
			if (this.isActiveEdit(this.FORM_PERSON_DETAILS)){
				$rootScope.$broadcast(this.ACTION_PEOPLE);
			} else {
				this.clearEditController();
				this.showPersonDetails();
			}
		}
		
		nav.editPeopleDetails = function(person) {
			this.clearAction();
			this.actionArg = person;
			this.action = this.ACTION_PEOPLE_OPEN_EDIT;
			
			this.launchPeopleEdit();
		}
		
		nav.launchPeopleEdit = function() {
			if (this.isActiveEdit(this.FORM_PERSON_EDIT)){
				$rootScope.$broadcast(this.ACTION_PEOPLE);
			} else {
				this.clearEditController();
				this.showPersonEdit();
			}
		}
		
		nav.showPersonEdit = function() {
	        nav.sideEditFormHidden = false;
	        nav.activeSideEditForm = this.FORM_PERSON_EDIT;
        }
		
		nav.showPersonDetails = function() {
	        nav.sideEditFormHidden = false;
	        nav.activeSideEditForm = this.FORM_PERSON_DETAILS;
        }
		
		nav.newPerson = function() {
			this.clearAction();
			this.action = this.ACTION_PEOPLE_NEW;
			
			this.launchPeopleEdit();
		}
		
		//Preference Actions
		nav.showTagsPreferences = function() {
			this.showPrefTag();
		}

		nav.showFAQs = function() {
			this.clearAction();
			this.action = this.ACTION_PREF_FAQ;

			this.showPrefFAQs();
		}
		
		nav.showTeam = function() {
			this.clearAction();
			this.action = this.ACTION_PREF_TEAM;

			this.showPref();
		}

		// Folder Edit Actions
		nav.openFolderEditDetails = function(folder) {
			this.clearAction();
			this.actionArg = folder;
			this.action = this.ACTION_FOLDER_EDIT_DETAILS;
			
			this.launchFolderEditDetails();
		}
		
		nav.launchFolderEditDetails = function() {
			if (this.isActiveEdit(this.FORM_FOLDER_EDIT)){
				$rootScope.$broadcast(this.ACTION_FOLDER);
			} else {
				this.clearEditController();
				this.showEditFolders();
			}
		}
		
		nav.showEditFolders = function() {
	        nav.sideEditFormHidden = false;
	        nav.activeSideEditForm = this.FORM_FOLDER_EDIT;
		}
		
		nav.newFolder = function() {
			this.clearAction();
			this.action = this.ACTION_FOLDER_NEW;
			
			this.launchFolderEditDetails();
		}
		
		//General nav
		nav.gotoHome = function() {
			nav.hideAll();
			$state.go('mywork.dashboard', {}, {reload: true});
		}
		
		nav.gotoSignin = function() {
			window.location.replace("/Login.html");
		}
		
		nav.gotoUnauthorized = function() {
			//window.location.replace("/Error401.html");
			nav.gotoSignin();
		}
		
		nav.gotoError = function(errMsg) {
			window.location.replace("/error");
		}
		
		nav.clearDefaultProject = function() {
			nav.defaultProject = null;
		}

		nav.clearDefaultPerson = function() {
			nav.defaultPerson = null;
		}
		
		return nav;
	}]);
	
}());