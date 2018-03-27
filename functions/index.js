//import { user } from 'firebase-functions/lib/providers/auth';
//firebase deploy --only functions
const functions = require('firebase-functions');
const moment = require('moment');

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
        response.send("Hello from CASCADES!");
});

exports.notify = functions.https.onRequest((request, response) => {
        const to = "fr3-1dow4z0:APA91bEYUcRdYrWm8ZPfkgRWOfVi0Op1sfdaY_NblcA0ko6lYwQsPNNLc98Lq2rnS9huJ4bKPtFw7Xx975FDMd3-UsXuLbdsMYt2ZzqViwQiZT-2m6BAafvxEEX_wGKGNFHcwWIhPvQx";
        const body = "This is a test message";
        const icon = "https://firebasestorage.googleapis.com/v0/b/temporal-potion-575.appspot.com/o/Avatars%2F-KgR_dYIB3me1qg-MXi9%2FBABY_DAMON.jpg?alt=media&token=4e97f25e-8b86-4433-bccc-f1a4aeb135f1";

        sendMessage(to, body, icon);

        
        response.send("Notify CASCADES people :)");
});

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

                        updates[updateKey + "/updatedByUser"] = "CASCADES_CLOUD";  
                        logMsg(funcName, 'Updates:', updates);

                        root.update(updates).then(snap => {
                                logMsg(funcName, "UPDATED Task");

                                
                                //Add Activity
                                //Notify Users
                                //Calculate stats
                        }) 

                })

                return true;
});

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

function sendMessage(notifTo, notifBody, notifIcon) {
        const funcName = "(sendMessage) ";


        admin.sendMessage()
        var req= {
                method: 'POST',
                url: 'https://fcm.googleapis.com/fcm/send',
                headers: {
                        "Authorization": "key=AAAAOqv0rEs:APA91bE0cGlnAk18xThXCqWYZXbTuz-TbXppp1GFN3vpPNtDsUPjtz7qFYkyC_HRqHPkoGDPOUZatyVc-5nSaOqmA8KUYDQU0izly7oSt8hRTzt6zn3kOBrQu0j9uczYrC5jvOj8U7Ar",
                        "Content-Type": "application/json"
                },
                "data": {
                        "to": notifTo,
                        "notification": {
                                "title": "CASCADES",
                                "body": notifBody,
                                "icon": notifIcon
                        }
                }
        };

        $http(req).then(function successCallback(response) {
                logMsg(funcName, "Message sent successfully");
        }, function errorCallback(response) {
                logMsg(funcName, response.status);
        });
}

function logMsg() {
        console.log.apply(console, arguments);
}

