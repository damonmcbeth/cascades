                                                                                                //import { user } from 'firebase-functions/lib/providers/auth';
//firebase deploy --only functions
const functions = require('firebase-functions');
const moment = require('moment');
const _ = require('lodash');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
        response.send("Hello from CASCADES!");
});

exports.notify = functions.https.onRequest((request, response) => {
        const to = "c6RbWRR8WxA:APA91bEoR24JaQUY62dV7TQJNm2-rItAFD0LMkvBT9UsAqHn4Ak1J-9XohOhaQ8A-xOq1VcouTwJMjhalSj9vTW_FWVXHViNLnLgGRYp0swnYqp9oLQ5sB-vGIIdVWp4RMBuxElv0NLk";
        const message = "This is a test message";
        const icon = "https://firebasestorage.googleapis.com/v0/b/temporal-potion-575.appspot.com/o/Avatars%2F-KgR_dYIB3me1qg-MXi9%2FBABY_DAMON.jpg?alt=media&token=4e97f25e-8b86-4433-bccc-f1a4aeb135f1";

        const funcName = "(sendMessage) ";

        // Notification details.
        const payload = {
                notification: {
                title: 'You have a new follower!',
                body: message,
                icon: icon,
                },
        };

        const tokens = [to];

        logMsg(funcName, admin.messaging().sendToDevice);
        admin.messaging().sendToDevice(to, payload).then((response) => {
                logMsg(funcName, 'Dry run successful:', response);
        }).catch((error) => {
                logMsg(funcName, 'Error during dry run:', error);
        });
        
        response.send("Notify CASCADES people :)");
}); 

exports.updateJournal = functions.database
        .ref('/App/Workspaces/{workspaceId}/Journal/{journalId}')
        .onWrite((event) => {
                var updated;
                var updates = {};
                var updateKey;

                const funcName = "(updateJournal) ";
                const workspaceId = event.params.workspaceId;
                const journalId = event.params.journalId;
                
                if (event.data.exists()) {
                        updated = event.data.val();
                //        user = updated.updatedByUser;

                        //if (user == undefined || user == null || user == "CASCADES_CLOUD") {
                        //        logMsg(funcName, 'Exiting due to user being empty or CASCADES_CLOUD');
                        //        return null;
                        //}
                }
                
                const root = event.data.ref.root;
                const previous = event.data.previous.val();
                const userid = updated.updatedBy;

                //logMsg(funcName, 'Journal Entry Id:', event.params.journalId);
                //logMsg(funcName, 'Original entry:', previous);
                //logMsg(funcName, 'Updated entry:', updated);

                if (shouldUpdateJournalStats(updated, previous)) {
                        //logMsg(funcName, 'shouldUpdateJournalStats:', true);
                        retrieveAllJournalEntries(workspaceId, root).then(snap => {
                                if (snap.exists()) {
                                        const journal = snap.val();
                                        var entries = _.values(journal);
                                        var filteredEntries = _.reject(entries, { 'archived': true });

                                        //logMsg(funcName, "filtered Entries", filteredEntries.length);

                                        root.child(`/Users`).once('value').then(usersSnap => {
                                                if (usersSnap.exists()) {
                                                        var users = usersSnap.val();
                                                        var keys = _.keys(users);
                                                        var len = keys.length;
                                                        var wrkSpcs;
                                                        var user;
                                                        var personId;
                                                        var readFlag;
                                                        var totalUnread = 0; 
                                                        var filter = {};
                                
                                                        for (i=0; i<len; i++) {
                                                                user = users[keys[i]]; 
                                                                //logMsg(funcName, "user:", user);

                                                                if (user["status"] == "active") {
                                                                        if (includesWorkspace(workspaceId, user)) {
                                                                                personId = user["person"];
                                                                                readFlag = `READ_${personId}`;
                                                                                filter = {};
                                                                                filter[readFlag] = "Y";
                                                                                //logMsg(funcName, 'filter:', filter);

                                                                                totalUnread = (_.reject(filteredEntries, filter)).length;

                                                                                updateKey = `/App/Workspaces/${workspaceId}/Summary/${personId}/Journal/unread`;
                                                                                updates[updateKey] = totalUnread; 
                                                                        }
                                                                }
                                                        }
                                
                                                        //logMsg(funcName, 'Updates:', updates);
                                                        root.update(updates).then(snap => {
                                                                logMsg(funcName, "UPDATED Journal Stats");                                                                
                                                        }) 
                                                }
                                        });    
                                }
                        });

                } else {
                        //logMsg(funcName, 'shouldUpdateJournalStats:', false);
                }
                
                return true;
});

function includesWorkspace(workspaceId, user) {
        const funcName = "(includesWorkspace) ";
        var wrkSpcs = _.keys(user.Workspaces);
        var fIndex = _.indexOf(wrkSpcs, workspaceId)

        //logMsg(funcName, "fIndex:", fIndex);

       return (fIndex != -1);
}

function shouldUpdateJournalStats(entry, prev) {
        const funcName = "(shouldUpdateJournalStats) ";
        var opt = {};

        opt.hasPrev = prev != undefined && prev != null;
        opt.hasEntry = entry != undefined && entry != null;

        opt.isNew = opt.hasEntry && !opt.hasPrev;
        opt.isChanged = opt.hasEntry && opt.hasPrev;

        opt.prevRead = (opt.hasPrev) ? prev.status == "Read" : false;
        opt.entryRead = (opt.hasEntry) ? entry.status == "Read" : false;

        opt.readChanged = opt.prevRead != opt.entryRead;
        opt.archivedChanged = (opt.isChanged) ? entry.archived != prev.archived : false;
        opt.isArchived = (opt.hasEntry) ? entry.archived : false;

        logMsg(funcName, "opt: ", opt)

        if (opt.archivedChanged || opt.readChanged || opt.isNew) {
                return true;
        }

        return false;
}

exports.updateTasks = functions.database
        .ref('/App/Workspaces/{workspaceId}/Tasks/{taskId}')
        .onWrite((event) => {
                var updated;
                var user;
                var updates = {};

                const funcName = "(updateTasks) ";
                const workspaceId = event.params.workspaceId;
                const taskId = event.params.taskId;
                const updateKey = `/App/Workspaces/${workspaceId}/Tasks/${taskId}`

                if (event.data.exists()) {
                        updated = event.data.val();
                        user = updated.updatedByUser;

                        if (user == undefined || user == null || user == "CASCADES_CLOUD") {
                                logMsg(funcName, 'Exiting due to user being empty or CASCADES_CLOUD');
                                return null;
                        }
                }

                const root = event.data.ref.root;
                const previous = event.data.previous.val();
                const userid = updated.updatedBy;

                logMsg(funcName, 'Task Id:', event.params.taskId);
                logMsg(funcName, 'Original task:', previous);
                logMsg(funcName, 'Updated task:', updated);

                retrieveTaskSettings(user, workspaceId, root).then(snap => {
                        var setting_soon = 10; 
                        if (snap.exists()) {
                                const settings = snap.val();
                                setting_soon = settings.soon;
                        }

                        determineTaskStatus(updated, previous, updates, updateKey);
                        determineTaskState(updated, setting_soon, updates, updateKey);
                        updateTaskSummary(updated, previous, workspaceId, root, updates);

                        updates[updateKey + "/updatedByUser"] = "CASCADES_CLOUD";  
                        logMsg(funcName, 'Updates:', updates);

                        root.update(updates).then(snap => {
                                logMsg(funcName, "UPDATED Task");

                                //Add Activity
                                notifyTaskAssignment(updated, previous, workspaceId, root);
                                
                        }) 

                })

                return true;
});

function notifyTaskAssignment(task, prev, workspaceId, root) {
        //if assignment has changed the send it

        var msg = `You have been assigned task: ${task.title}`;
        var icon;
        var user = task.ownerId

        sendMsg(user, workspaceId, root, msg);
}

function retrieveTaskSettings(user, workspaceId, root) {
        return root.child(`/Users/${user}/Workspaces/${workspaceId}/Settings/Task`).once('value');
}

function determineTaskStatus(task, prev, updates, updateKey) {
        const funcName = "(determineTaskStatus) ";
        var opt = {}

        opt.hasPrev = prev != undefined && prev != null;
        opt.hasTask = task != undefined && task != null;

        opt.isNew = opt.hasTask && !opt.hasPrev;
        opt.isDeleted = !opt.hasTask && opt.hasPrev;
        opt.isChanged = opt.hasTask && opt.hasPrev;

        opt.prevDone = (opt.hasPrev) ? prev.isDone : false;
        opt.taskDone = (opt.hasTask) ? task.isDone : false;

        opt.doneChanged = opt.prevDone != opt.taskDone;
        opt.statusChanged = (opt.isChanged) ? task.status != prev.status : false;
        opt.statusIsDone = (opt.hasTask) ? task.status == "Done" : false;
        opt.statusDoneMismatch = opt.taskDone != opt.statusIsDone;

        logMsg(funcName, "opt: ", opt)

        if (opt.isNew && opt.statusIsDone) {
                logMsg(funcName, 'STATUS is New and Done');         
                updates[updateKey + "/isDone"] = true;
        } else if (opt.isChanged && opt.doneChanged && opt.statusDoneMismatch) {
                logMsg(funcName, 'STATUS is Changed and Done changed'); 
                updates[updateKey + "/status"] = (task.isDone) ? "Done" : "In Progress";
        } else if (opt.isChanged && opt.statusChanged && opt.statusDoneMismatch) {
                logMsg(funcName, 'STATUS is Changed and status changed'); 
                updates[updateKey + "/isDone"] = opt.statusIsDone ? true : false;
        } else if (opt.isDeleted) {
                //Do nothing
        } else if (opt.statusDoneMismatch) {
                //the status wins
                updates[updateKey + "/isDone"] = opt.statusIsDone ? true : false;
        }
}

function determineTaskState(task, settings_soon, updates, updateKey) {
        const funcName = "(determineTaskState) ";
        
        var bod = moment().startOf('day');
        var eod = moment().endOf('day');
        var soon = moment().add(settings_soon, 'days');
        
        var prev = "";
        var due = null;
        
        var isGoingToBeDone = updates[updateKey + "/isDone"] == true ? true : false;
        var isGoingToBeUnDone = updates[updateKey + "/isDone"] == false ? true : false;

        logMsg(funcName, "isGoingToBeDone: ", isGoingToBeDone, "isDone: ", task.isDone);

        prev = task.state;
        due = (task.due == undefined || task.due == null) ? null : moment(task.due);
        
        if ((task.isDone && !isGoingToBeUnDone) || isGoingToBeDone) {
                logMsg(funcName, "Should change state to Done");
                task.state = 'Done';
        } else if (due == null) {
                logMsg(funcName, "Should change state to No due date");
                task.state = 'No due date';
        } else if (due < bod) {
                logMsg(funcName, "Should change state to Overdue");
                task.state = 'Overdue';
        } else if (due >= bod && due <= eod) {
                logMsg(funcName, "Should change state to Due today");
                task.state = 'Due today';
        } else if (due < soon) {
                logMsg(funcName, "Should change state to Due soon");
                task.state = 'Due soon';			
        } else {
                logMsg(funcName, "Should change state to Due later");
                task.state = 'Due later';
        }
        
        logMsg(funcName, "Prev state: ", prev, "Curr state: ", task.state);
        if (prev != task.state) {
                updates[updateKey + "/state"] = task.state;
        }
        
};

function sendMsg(user, workspaceId, root, message, icon) {
        const funcName = "(sendMsg) ";
        const payloadIcon = (icon == undefined) ? "https://cascades.phenom-ideas.com/assets/img/Timeline_White_128.png" : icon;

        const payload = {
                notification: {
                        title: 'CASCADES',
                        body: message,
                        icon: payloadIcon,
                },
        };
        logMsg(funcName, "Notification payload: ", payload);

        retrieveTaskSettings(user, workspaceId, root).then(snap => {
                var token; 
                if (snap.exists()) {
                        const user = snap.val();
                        logMsg(funcName, "user: ", user);
                        token = user.notificationToken;
                }

                if (token == undefined || token == null) {
                        logMsg(funcName, "Recipient token is undefined.");
                } else {
                        admin.messaging().sendToDevice(token, payload).then((response) => {
                                logMsg(funcName, 'Notification successful:', response);
                        }).catch((error) => {
                                logMsg(funcName, 'Error during notification:', error);
                        });
                }
        })

}

function buildSummaryList(updated, previous, list) {
        var result = list;

        if (updated != null && updated != undefined) {
                result.push(updated);
        }

        if (previous != null && previous != undefined && updated != previous) {
                result.push(previous);
        }

        return result;
}

function updateTaskSummary(updated, previous, workspaceId, root) {
        const funcName = "(updateTaskSummary) ";

        var people = [];
        var projects = [];

        people = buildSummaryList(updated.ownerId, previous.ownerId, people);
        people = buildSummaryList(updated.delegateId, previous.delegateId, people);
        logMsg(funcName, "people:", people);

        var taskSum;
        var i=0;
        var len=people.length;
        var lookupKey;
        
        retrieveAllTasks(workspaceId, root).then(snap => {
                if (snap.exists()) {
                        const tasks = snap.val();
                        for (i=0; i<len; i++) {
                                taskSum = { total: 0,
                                                openTotal: 0,
                                                delegated: 0,
                                                dueToday: 0,
                                                dueSoon: 0,
                                                overdue: 0
                                };
                                
                                calTaskSummaryForPerson(tasks, people[i], taskSum);
                                saveTaskSummary(people[i], taskSum);
                        }
                        
                        /*if (projects != null) {
                                len = projects.length;
                                i=0;
                                
                                for (i=0; i<len; i++) {
                                        self.calProjectSummary(projects[i]);
                                }
                        }*/
                }
        });
}

function calTaskSummaryForPerson(tasks, person, taskSum) {
        const funcName = "(calTaskSummaryForPerson) ";
        
        var taskValues = _.values(tasks);
        var filteredTasks = _.filter(taskValues, { 'ownerId': person });

        logMsg(funcName, "tasks count:", taskValues.length, "tasks:", taskValues);
        logMsg(funcName, "person:", person);
        logMsg(funcName, "filteredTasks count:", filteredTasks.length, "filteredTasks:", filteredTasks);
        
        taskSum.total = filteredTasks.length;
        taskSum.openTotal = _.filter(filteredTasks, {'isDone':false}).length; 
        taskSum.delegated = _.filter(filteredTasks, {delegateId:'', isDone:false}).length;
        
        taskSum.overdue = _.filter(filteredTasks, {state:'Overdue', isDone:false}).length;
        taskSum.dueToday = _.filter(filteredTasks, {state:'Due today', isDone:false}).length;
        taskSum.dueSoon = _.filter(filteredTasks, {state:'Due soon', isDone:false}).length;
        
        logMsg(funcName, "taskSum:", taskSum);

        return taskSum;
}

function saveTaskSummary(workspaceId, person, taskSum, updates) {
        var updateKey = "App/Workspaces/" + globalSettings.currWorkspace.$id 
                                                    + "/Summary/" + person + "/Task"; 
        updates[updateKey] = taskSum;       
}

function retrieveAllJournalEntries(workspaceId, root) {
        return root.child(`/App/Workspaces/${workspaceId}/Journal`).once('value');
}

function retrieveAllTasks(workspaceId, root) {
        return root.child(`/App/Workspaces/${workspaceId}/Tasks`).once('value');
}

function retrieveUser(user, workspaceId, root) {
        return root.child(`/App/Workspaces/${workspaceId}/People/${user}`).once('value');
}

function retrieveAllActiveUsers(workspaceId, root) {
        const funcName = "(retrieveAllUsers) ";

        root.child(`/Users`).once('value').then(snap => {
                if (snap.exists()) {
                        var users = _.values(snap.val());
                        var activeUsers = _.filter(users, { 'status': "active" });
                        var filteredUsers = [];
                        var len = activeUsers.length;
                        var wrkSpcs;

                        for (i=0; i<len; i++) {
                                wrkSpcs = _.keys(activeUsers[i].Workspaces);
                                logMsg(funcName, "wrkSpcs:", wrkSpcs);

                                filteredUsers.push(activeUsers[i]);
                        }

                        return filteredUsers;
                }
        });

        return null
}

function logMsg() {
        console.log.apply(console, arguments);
}

