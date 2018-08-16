(function() {
    'use strict';

    var app = angular.module('app');
    
    app.factory('globalSettings', ['$rootScope', '$http', '$q', '$interval', 'globalNav', 'fireAuth', '$firebaseObject', '$firebaseArray', 
    			'$mdToast', 
    	function($rootScope, $http, $q, $interval, globalNav, fireAuth, $firebaseObject, $firebaseArray, $mdToast) {
	    
	    function GlobalSettings() {
			var self = this;
			
			self.CSS_COLOR_NAMES = ["#DCDCDC", "#e48701", "#a5bc4e", "#1b95d9", "#caca9e",
				"#6693b0", "#f05e27", "#86d1e4", "#e4f9a0",
				"#ffd512", "#75b000", "#0662b0", "#ede8c6",
				"#cc3300", "#d1dfe7", "#52d4ca", "#c5e05d",
				"#e7c174", "#fff797", "#c5f68f", "#bdf1e6",
				"#9e987d", "#eb988d", "#91c9e5", "#93dc4a",
				"#ffb900", "#9ebbcd", "#009797", "#0db2c2",
				"#46BFBD", "#FDB45C", "#949FB1", 
				"#4D5360", "#803690", "#00ADF9"];
			
			self.pref = {
				org: {},
				project:{
					recent: 3
				},
				task: {},
				people: {
					imagePath: "assets/img/avatars/",
					recent: 5
				},
				journal: {
					recent: 4
				},
				journalTypes: [
					"Memo",
					"Phone call",
					"Image",
					"Idea",
					"Meeting",
					"Document",
					"Food"
				],
				calFormats: {
					sameDay: "[Today at ] h:mma",
					nextDay: "[Tomorrow at ] h:mma",
					nextWeek: "dddd [at] h:mma",
					lastDay: "[Yesterday at ] h:mma",
					lastWeek: "[Last] dddd [at] h:mma",
					sameElse: "ddd, MMM D, YYYY,  h:mma"
					},
				calShortFormats: {
					sameDay: "[Today]",
					nextDay: "[Tomorrow]",
					nextWeek: "dddd",
					lastDay: "[Yesterday]",
					lastWeek: "[Last] dddd",
					sameElse: "ddd, MMM D"
					},
				calMidFormats: {
					sameDay: "[Today]",
					nextDay: "[Tomorrow]",
					nextWeek: "dddd",
					lastDay: "[Yesterday]",
					lastWeek: "[Last] dddd",
					sameElse: "ddd, MMM D, YYYY"
					},
				calTimeFormats: {
					sameDay: "h:mma",
					nextDay: "h:mma",
					nextWeek: "h:mma",
					lastDay: "h:mma",
					lastWeek: "h:mma",
					sameElse: "h:mma"
					},
				colors: self.CSS_COLOR_NAMES,
				avatars: [
					"1.png",
					"2.png",
					"3.png",
					"4.png",
					"5.png",
					"6.png",
					"7.png",
					"8.png",
					"9.png",
					"10.png",
					"11.png",
					"12.png",
					"13.png",
					"14.png",
					"15.png",
					"16.png",
					"17.png",
					"18.png",
					"19.png",
					"20.png",
					"21.png",
					"22.png",
					"23.png",
					"24.png"
				],
				subscriptionPlans: ['Basic',
									 'Pro',
									 'Business'
									]
			};
		
			self.INITIALIZED = "I";
			self.NOT_INITIALIZED = "N";
			self.INITIALIZING = "P";
			
			self.authUser = null;
			self.currProfile = null;
			self.currWorkspace = null;
			self.currPreferences = null;
			self.userWorkspaces = null;
			
			self.adminApp = null;
			
			self.initState = self.NOT_INITIALIZED;
			
			self.debugLog = [];
			
			self.cacheMap = {};
		
		
			self.shouldClearCache = function(key) {
				var result = false;
				var currWrkspc = self.currWorkspace == null ? null : self.currWorkspace.$id;
				
				if (self.cacheMap[key] == null || self.cacheMap[key] != currWrkspc) {
					result = true;
					
				}
				
				return result;
			}
			
			self.setCache = function(key) {
				var currWrkspc = self.currWorkspace == null ? null : self.currWorkspace.$id;
				self.cacheMap[key] = currWrkspc;
			}
			
			self.initSettings = function() {
			    var deferred = $q.defer();
			    
			    if (self.initState == self.INITIALIZED) {
				    deferred.resolve(true);
			    
			    } else if (self.initState == self.INITIALIZING) {
				    self.log("globalSettings.service", "initSettings", "Waiting for Initializing settings");
					self.initCompleted().then(
						function() {
							deferred.resolve(true);
						}
					)
				
				} else {
					self.initState = self.INITIALIZING;
					self.log("globalSettings.service", "initSettings", "Initializing settings");
					
					self.initAuthorizedUser().then(
					    function() {
							deferred.resolve(true);
					});
				}
				
				return deferred.promise;
			};
			
			self.initCompleted = function() {
				var deferred = $q.defer();
				var interval;
				
				interval = $interval(function() {
									  if (self.initState != self.INITIALIZING) {
										  $interval.cancel(interval);
										  self.log("globalSettings.service", "initCompleted", "Ending wait for init");
										  deferred.resolve(true);
									  }}, 1000, 15);
				
				return deferred.promise;
			}
			
			self.initAuthorizedUser = function() {
			    var deferred = $q.defer();
			    
				//if (self.authUser != null) { //IF NOT AUTHORIZED THEN
					fireAuth.$onAuthStateChanged(function(authUser) {
						var tmpId = null;
						
						self.authUser = authUser;
						if (self.authUser == null) {
							var reason = "";
							
							if (self.initialized == self.INITIALIZED) {
								reason = "USER LOGGED OUT";
								globalNav.gotoSignin(); 
							} else {
								self.initialized = self.NOT_INITIALIZED;
								reason = "NOT AUTHORIZED";
								globalNav.gotoUnauthorized();
							}
							
							self.log("globalSettings.service", "initAuthorizedUser", reason);
							deferred.reject(reason);
							
						} else {
							self.log("globalSettings.service", "getCurrUserid", "User authorized: " + self.authUser.uid);
							
							self.initProfile().then(function (result) {
								self.initialized = self.INITIALIZED;
								deferred.resolve(result);
							});
						}
					});
					
				//} else {
				//	deferred.resolve(true);
				//}
				
				return deferred.promise;
			};
			
			
			self.initProfile = function() {
				var deferred = $q.defer();
				
				var lookupKey = "Users/" + self.authUser.uid; 
				var userRef = firebase.database().ref().child(lookupKey);
				
				self.currProfile = $firebaseObject(userRef);
				self.currProfile.$loaded().then(function(data) {
					
					var workspaceKey;
					var defWorkspace;
					
					if (data.status == undefined) {
						self.log("globalSettings.service", "initProfile", "Workspace not found. Creating default");
						
						self.createDefaultProfile(self.authUser);
						defWorkspace = self.createDefaultWorkspace(self.authUser);
					} else {
						if (self.hasWorkspace(data)) {
							defWorkspace = self.getDefaultWorkspace(data);
						} else {
							defWorkspace = self.createDefaultWorkspace(self.authUser);
						}
					}
					
					workspaceKey = defWorkspace.id;
					self.loadUserWorkspaces().then(
						function(data) {
							self.currPreferences = self.userWorkspaces.$getRecord(workspaceKey);
							
							self.loadWorkspace(workspaceKey).then(
								function(data) {
									self.initState = self.INITIALIZED;
									 
									self.log("globalSettings.service", "initProfile", "Workspace loaded: " + workspaceKey);
									deferred.resolve(true);
								}
							)
						}
					)								
				});

				
				return deferred.promise;
			}
			
			self.getWorkspace = function(workspaceKey) {
				var deferred = $q.defer();
				
				var lookupKey = "Workspaces/" + workspaceKey;
				var workspaceRef = firebase.database().ref().child(lookupKey);
				var wrkSpc = $firebaseObject(workspaceRef);
				wrkSpc.$loaded().then(
					function(data) {
						deferred.resolve(wrkSpc);
					}
				)

				return deferred.promise;
			}
			
			self.loadWorkspace = function(workspaceKey) {
				var deferred = $q.defer();
				
				var lookupKey = "Workspaces/" + workspaceKey;
				var workspaceRef = firebase.database().ref().child(lookupKey);
				self.currWorkspace = $firebaseObject(workspaceRef);
				self.currWorkspace.$loaded().then(
					function(data) {
						deferred.resolve(true);
					}
				)

				return deferred.promise;
			}
			
			self.loadUserWorkspaces = function() {
				var deferred = $q.defer();
				
				var lookupKey = "Users/" + self.authUser.uid + "/Workspaces"; 
				var prefRef = firebase.database().ref().child(lookupKey);
				
				self.userWorkspaces = $firebaseArray(prefRef);
				self.userWorkspaces.$loaded().then( 
					function(data) {
						deferred.resolve(true);
				});
				
				return deferred.promise;

			}
			
			self.hasWorkspace = function(profile) {				
				return (profile.Workspaces != undefined);
			}
			
			self.getDefaultWorkspace = function(profile) {
				var result = null;
				
				if (self.hasWorkspace(profile)) {
					angular.forEach(profile.Workspaces, function(value, key) {
						if (result == null && value.status == "active") {
							result = {id:key, value:value}; 
						}
       				});
				
				}
				
				return result;
			}
			
			self.createDefaultProfile = function(user) {
				var uid = user.uid;
				var userName = user.displayName;		
				var avatarDefault = self.determineDefaultAvatar(user);

				var profile = {
					    name: userName,
					    status: "active",
					    avatar: avatarDefault.image,
					    avatarType: avatarDefault.type,
					    created: firebase.database.ServerValue.TIMESTAMP
					  };
					  
				firebase.database().ref().child("/Users/" + uid).set(profile);
				
			}

			
			self.createDefaultWorkspace = function(user, defaultPersonKey) {
				var userName = user.displayName;
				var uid = user.uid;
								
				var ref = firebase.database().ref().child("Workspaces");
				var newKey = ref.push().key;
				var parsedName = NameParse.parse(userName);

				var workspaceData = {
					    description: "",
					    name: parsedName.firstName + "'s Workspace",
					    created: firebase.database.ServerValue.TIMESTAMP,
					    status: "active",
					    Terminology: {
						    projectAlias: "Project",
							projectAliasPlural: "Projects",
							clientAlias: "Client",
							clientAliasPlural: "Clients",
							taskAlias: "Task",
							taskAliasPlural: "Tasks",
							memoAlias: "Memo",
							memoAliasPlural: "Journal"
					    },
					    Subscription: {
						    plan: "Individual",
							renewal: moment().add(1, 'years').toDate(),
							autoDelete: 90
					    },
					    Settings: {
						    debug: false,
							Task: {
								states: [
									{
										label: "Not Started",
										editable: false,
										order: -1
									},
									{
										label: "In Progress",
										editable: true,
										order: 1
									},
									{
										label: "Custom",
										editable: true,
										order: 2
									},
									{
										label: "Done",
										editable: false,
										order: 99999
									}
								]
							},
							Project: {
								types: [
									{
										title: "General",
										revenue: 0
									},
									{
										title: "Bankruptcy",
										revenue: 3000
									},
									{
										title: "Product Development",
										revenue: 10500
									},
									{
										title: "Marketing",
										revenue: 6300
									}
								]
							}
						}					  
					};
					  
				var updates = {};
				updates['/Workspaces/' + newKey] = workspaceData;
				firebase.database().ref().update(updates);
				
				var workspacePref = self.assignWrkSpcToProfile(newKey, workspaceData.name, uid);
				var personKey = self.initDefaultPerson(newKey, user, defaultPersonKey);
				self.initDefaultProject(newKey, personKey, user);
				self.initDefaultSummary(newKey, personKey);
				self.initDefaultTicket(newKey, personKey);
				
				return {id:newKey, value:workspacePref};
			}
			
			self.initDefaultSummary = function(wsKey, personKey) {
				var summary = {
						task: {
							due: 0,
							overdue: 0,
							dueSoon: 0,
							delegated: 0,
							dueToday: 1,
							openTotal: 1,
							total: 1
						},
						Journal: {
							unread: 0
						},
						Project: {
							open: 0	
						}
					};
				
				firebase.database().ref().child("/App/Workspaces/" + wsKey + "/Summary/" + personKey).set(summary);
			}

			
			self.initDefaultTicket = function(wsKey, personKey) {
				var ticket = {
						name: "Welcome to Cascades",
						status: "Open",
						read: false,
						details: "This is the filler text for the ticket details section.",
						created: firebase.database.ServerValue.TIMESTAMP,
						updated: firebase.database.ServerValue.TIMESTAMP,
						createdBy: personKey,
						updatedBy: personKey
					};
				
				var ticketKey = firebase.database().ref().child("/App/Workspaces/" + wsKey + "/Tickets").push().key;
				var updates = {};
				updates["/App/Workspaces/" + wsKey + "/Tickets/" + ticketKey] = ticket;
				firebase.database().ref().update(updates);
			}

			
			self.assignWrkSpcToProfile = function(wsKey, wsName, uid) {
				var userWrkSpace = {
						name: wsName,
						status: "active",
						isOwner: true,
						isAdmin: true,
						Settings: {
							Project: {
								taskBoardGroup: "Status",
								taskBoardOrder: "Priority",
							},
							Task: {
								soon: 10,
								taskBoardGroup: "Schedule",
								taskBoardOrder: "due",
								quickGroup: "Schedule"
							}
						}
					};
				firebase.database().ref().child("/Users/" + uid + "/Workspaces/" + wsKey).set(userWrkSpace);
				return userWrkSpace;
			}
			
			self.determineDefaultAvatar = function(user) {
				var avatarImg = "empty-icon.png";
				var avatarImgType = "Stock";
				
				if (user.photoURL != null) {
					if (user.photoURL.startsWith("#Stock_")) {
						avatarImg = user.photoURL.substring(7, user.photoURL.length);
					} else {
						avatarImg = user.photoURL;
						avatarImgType = "Custom";
					}	
				}
								
				return { image: avatarImg,
						 type: avatarImgType };
				
			}
			
			self.initDefaultPerson = function(wsKey, user, defaultPersonKey) {
				
				var personKey;
				if (defaultPersonKey == undefined) {
					personKey = firebase.database().ref().child("/App/Workspaces/" + wsKey + "/People").push().key;
				} else {
					personKey = defaultPersonKey;
				}
				
				var parsedName = NameParse.parse(user.displayName);
				var avatarDefault = self.determineDefaultAvatar(user);
				var uid = user.uid;
				
				var person = {
								name: user.displayName,
								first: parsedName.firstName,
								last: parsedName.lastName,
								avatar: avatarDefault.image,
								avatarType: avatarDefault.type,
								type: "Team member",
								primaryEmail: user.email,
								state: "Established",
								title: "Owner",
								isOwner: true,
								isUser: true,
								isAdmin: true,
								active: true,
								created: firebase.database.ServerValue.TIMESTAMP,
								updated: firebase.database.ServerValue.TIMESTAMP,
								createdBy: personKey,
								updatedBy: personKey,
								createdName: user.displayName,
								updatedName: user.displayName
							};
							
				var updates = {};
				updates["/App/Workspaces/" + wsKey + "/People/" + personKey] = person;
				updates["/Users/" + uid + "/person"] = personKey;
				firebase.database().ref().update(updates);
				
				return personKey;
			}
			
			self.initDefaultProject = function(wsKey, personKey, user) {
				var project = {
								title: "Personal Work",
								typeId: "1",
								type: "General",
								status: "Open",
								isDone: false,
								perComp: 0,
								revenue: 0,
								ownerId: personKey,
								ownerName: user.displayName,
								start: firebase.database.ServerValue.TIMESTAMP,
								created: firebase.database.ServerValue.TIMESTAMP,
								updated: firebase.database.ServerValue.TIMESTAMP,
								createdBy: personKey,
								updatedBy: personKey,
								createdName: user.displayName,
								updatedName: user.displayName
							};
							
				var projKey = firebase.database().ref().child("/App/Workspaces/" + wsKey + "/Projects").push().key;
				var updates = {};
				updates["/App/Workspaces/" + wsKey + "/Projects/" + projKey] = project;
				firebase.database().ref().update(updates);
				
				self.initDefaultTask(wsKey, personKey, projKey, user);
			}
			
			self.initDefaultTask = function(wsKey, personKey, projectKey, user) {
				var task = {
								title: "Learn about Cascades",
								hasChecklist: false,
								createdName: user.displayName,
								updatedName: user.displayName,
								created: firebase.database.ServerValue.TIMESTAMP,
								updated: firebase.database.ServerValue.TIMESTAMP,
								due: firebase.database.ServerValue.TIMESTAMP,
								createdBy: personKey,
								updatedBy: personKey,
								priority: "N",
								status: "Not Started",
								state: "No due date",
								projectId: projectKey,
								projectName: "My Personal Work",
								notes: "The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.",
								ownerId: personKey,
								ownerName: user.displayName,
								isDone: false
							};
				var taskKey = firebase.database().ref().child("/App/Workspaces/" + wsKey + "/Tasks").push().key;
				var updates = {};
				updates["/App/Workspaces/" + wsKey + "/Tasks/" + taskKey] = task;
				firebase.database().ref().update(updates);
			}
			
			self.retrieveWorkspaceTaskStatus = function() {
				var deferred = $q.defer();
				
	        	var lookupKey = "Workspaces/" + self.currWorkspace.$id + "/Settings/Task/states"; 
				var prefRef = firebase.database().ref().child(lookupKey).orderByChild("order");
				
				var list = $firebaseArray(prefRef);
				list.$loaded().then( 
					function(data) {
						deferred.resolve(list);
				});
	        	
	        	return deferred.promise;
			}
			
			self.selectWrkSpc = function(wrkSpc) {
				var deferred = $q.defer();
				
	        	self.loadWorkspace(wrkSpc.$id).then(
		        	function(data) {
			        	self.currPreferences = wrkSpc;
			        	globalNav.gotoHome();
			        	deferred.resolve(true);
		        	}
	        	)
	        	
	        	return deferred.promise;
        	}
			
			self.cloneWorkspace = function (src, dest) {
			    var result = (dest == null) ? {} : dest;
				
				result.name = src.name;
	            result.description = src.description;
	            
	            if (result.Terminology == undefined) {
		            result.Terminology = {};
	            }
	            
	            result.Terminology.projectAlias = src.Terminology.projectAlias;
	            result.Terminology.projectAliasPlural = src.Terminology.projectAliasPlural;
	            result.Terminology.clientAlias = src.Terminology.clientAlias;
	            result.Terminology.clientAliasPlural = src.Terminology.clientAliasPlural;
	            result.Terminology.taskAlias = src.Terminology.taskAlias;
	            result.Terminology.taskAliasPlural = src.Terminology.taskAliasPlural;
	            result.Terminology.memoAlias = src.Terminology.memoAlias;
	            result.Terminology.memoAliasPlural = src.Terminology.memoAliasPlural;
	            result.Subscription = {
		            	plan: src.Subscription.plan,
						renewal: src.Subscription.renewal,
						autoDelete: (src.Subscription.autoDelete == "" || src.Subscription.autoDelete == null) ? 90 : src.Subscription.autoDelete
		            };
	            
	            return result;
		    };
		    
		    self.saveOrg = function (edited, orig) {
				var nameChanged = (edited.name != orig.name);
				
				self.cloneWorkspace(edited, orig);
				orig.$save().then(
					function(ref) {
						self.log("globalSettings", "saveOrg", "Workspace updated");
						
						if (nameChanged) {
							var currWrkspc = self.currPreferences
							currWrkspc.name = edited.name

							self.userWorkspaces.$save(currWrkspc).then(
								function(ref) {
									self.log("globalSettings", "saveOrg:NameChanged", "Workspace name updated");
								},
								function(error) {
									self.logError("globalSettings", "saveOrg:NameChanged", error);
								}
							)
						}
					}, 
					function(error) {
						self.logError("globalSettings", "saveOrg", error);
					}
				);
		    };
		    
		    
		    self.getUserForPerson = function(personId) {
			    var deferred = $q.defer();
				
				self.initSettings().then(
					function() {
						var ref = firebase.database().ref().child("Users").orderByChild("person").equalTo(personId);
						
						var users = $firebaseArray(ref);
						users.$loaded().then( 
							function(data) {
								if (users.length > 0) {
									deferred.resolve(users);
								} else {
									deferred.resolve(null);
								}
						});

				});
				
				return deferred.promise;
		    }
		    
		    self.generatePassword = function() {
			    var length = 8,
			        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
			        retVal = "";
			    for (var i = 0, n = charset.length; i < length; ++i) {
			        retVal += charset.charAt(Math.floor(Math.random() * n));
			    }
			    return retVal;
			}
		    
		    self.getAdminConfig = function() {
			    if (self.adminApp == null) {
				    var adminConfig = { apiKey: "AIzaSyDesh4UPgrqBiB80p777aeeRSDd_N2geJA",
									authDomain: "temporal-potion-575.firebaseapp.com",
									databaseURL: "https://temporal-potion-575.firebaseio.com"
				  					};
				  					
				  	self.adminApp = firebase.initializeApp(adminConfig, "ADMIN");
				    
			    }
			    
			    return self.adminApp;
		    }
		    		    
		    self.createUser = function(person) {
			    var email = person.primaryEmail;
			    var admin = self.getAdminConfig();
				var password = self.generatePassword();
			    
			    admin.auth().createUserWithEmailAndPassword(email, password).then(
			    	function(user) {
			        	self.log("globalSettings.service", "createUser", "User created with uid: " + user.uid);
			        	
			        	var profile = { displayName: person.name };
			        	profile.photoURL = person.avatarType == "Custom" ? person.avatar : "#Stock_" + person.avatar;
			        	
			        	user.updateProfile(profile).then(
				        	function() {
					        	self.createDefaultProfile(user);
								self.createDefaultWorkspace(user, person.$id);
								self.assignCurrWrkSpcToProfile(user.uid, person);
					        	
								admin.auth().signOut();
								
								self.sendPasswordResetEmail(email);
								self.updateUser(person);
				        	}
			        	)
			        	
			        }).catch(function(error) {
			        	self.logError("globalSettings.service", "initAuthorizedUser:Error", error);
			    });
		    }
		    
		    self.updateUser = function(person) {
			    self.getUserForPerson(person.$id).then(
				    function(users) {
					    if (users != null) {
						    var user = users[0];
						       
							user.name = person.name;
							user.avatar = person.avatar;
							user.avatarType = person.avatarType;
							
							users.$save(user);
					    }
				});
		    }
		    
		    self.assignCurrWrkSpcToProfile = function(uid, person) {			    
				var userWrkSpace = {
						name: self.currWorkspace.name,
						status: "active",
						isOwner: false,
						isAdmin: person.isAdmin,
						Settings: {
							Project: {
								taskBoardGroup: "Status",
								taskBoardOrder: "Priority",
							},
							Task: {
								soon: 10,
								taskBoardGroup: "Schedule",
								taskBoardOrder: "due",
								quickGroup: "Schedule"
							}
						}
					};
				firebase.database().ref().child("/Users/" + uid + "/Workspaces/" + self.currWorkspace.$id).set(userWrkSpace);
				return userWrkSpace;
			}
		    
		    
		    self.sendPasswordResetEmail = function(email) {
			    fireAuth.$sendPasswordResetEmail(email).then(
			    	function() {
						self.log("globalSettings.service", "sendPasswordResetEmail", "Password reset email sent successfully!");
					}).catch(function(error) {
						self.logError("globalSettings.service", "sendPasswordResetEmail:Error", error);
				});
		    }
			
			self.showMsgToast = function(title, msg, icon) {
			    self.showToast(msg, "msg", icon);
		    }

		    self.showInfoToast = function(msg) {
			    self.showToast(msg, "info");
		    }
		    
		    self.showErrorToast = function(msg) {
			    self.showToast(msg, "error");
		    }
		    
		    self.showSuccessToast = function(msg) {
			    self.showToast(msg, "success");
		    }
		    
		    
		    self.showToast = function(msg, type, toastIcon) {
				var toastType = (type == "msg") ? "info" : type;
				var theme = (type == undefined) ? "" : "md-" + toastType + "-toast-theme";
				var delay = (type == "msg") ? 5000 : 2500; 
			    var icon = "";
			    
			    switch (type) {
				    case "info": icon = '<i class="icon pe-7s-info f-20 m-r-10"></i>'; break;
				    case "error": icon = '<i class="icon pe-7s-attention f-20 m-r-10"></i>'; break;
					case "success": icon = '<i class="icon pe-7f-check f-20 m-r-10"></i>'; break;
					case "msg": icon = '<image class="avatar-sm img-circle m-r-10" src="'+ toastIcon + '"></image>'; break;
			    }
			    
			    var tmp = '<md-toast class="' + theme +'">' +
					          '<div class="md-toast-content">' +
					          icon +
					          msg +
					          '</div>' +
							  '</md-toast>';
			    
			    $mdToast.show({
				    hideDelay: delay,
				    position: 'top right',
				    template: tmp
			    });
			    
		    }
		    
		    self.pushDebugLog = function(msg) {
			    if (self.debugLog.length == 30) {
				    self.debugLog.shift();
			    }
			    
			    self.debugLog.push(msg);
		    }
		    
		    self.log = function (module, funct, msg) {
			    var debug = false;
			    var tmp;
			    
			    if (self.currWorkspace != null && self.currWorkspace.Settings != null) {
				    debug = self.currWorkspace.Settings.debug;
			    }
			    
			    tmp = "[" + module + ":" + funct + "] " + JSON.stringify(msg);
			    if (debug) {
			    	console.log(tmp);
			    }
			    
			    self.pushDebugLog(tmp);
			    
		    }
		    
		    self.logError = function (module, funct, msg) {
				var m = (msg.message != undefined ? msg.message : (msg != undefined) ? null : msg);

			    var ticket = {
				    		name: "Error occured: " + m,
				    		details: (msg.stack == undefined ? null : msg.stack),
				    		module: module,
				    		method: funct,
				    		type: "Automated",
				    		read: false,
				    		status: "Open",
				    		workSpace: self.currWorkspace.$id,
				    		
			    		};
			    		
			    self.updateTimestamp(ticket);			    
			    self.log(module, funct, "Error: " + msg);
			    ticket.debugLog = self.debugLog;
			    
			    var wsKey = self.currWorkspace.$id;
			    var ticketKey = firebase.database().ref().child("/App/Workspaces/" + wsKey + "/Tickets").push().key;
				var updates = {};
				updates["/App/Workspaces/" + wsKey + "/Tickets/" + ticketKey] = ticket;
				firebase.database().ref().update(updates);
				
				self.showErrorToast('An error occurred. A ticket was automatically created and will be address soon as possible.');

		    }
		    
		    self.updateTimestamp = function(obj) {
			    if (obj.created == undefined || obj.created == null) {
				    obj.created = firebase.database.ServerValue.TIMESTAMP;
				    obj.createdBy = self.currProfile.person;
				    obj.createdName = self.currProfile.name;
			    }
			    
			    obj.updated = firebase.database.ServerValue.TIMESTAMP;
				obj.updatedBy = self.currProfile.person;
				obj.updatedName = self.currProfile.name;
			    
		    }
			
			
		}
		
		return new GlobalSettings();
	}]);
	
}());