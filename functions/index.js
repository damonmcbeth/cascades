//import { user } from 'firebase-functions/lib/providers/auth';
//
const functions = require('firebase-functions');
const moment = require('moment');

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
        response.send("Hello from CASCADES!");
});

exports.notify = functions.https.onRequest((request, response) => {
        response.send("Notify CASCADES people :)");
});

exports.updateTasks = functions.database
        .ref('/App/Workspaces/{workspaceId}/Tasks/{taskId}')
        .onWrite((event) => {
                var updated;
                var user;
                var updates = [];

                const workspaceId = event.params.workspaceId;
                const taskId = event.params.taskId;
                const updateKey = `/App/Workspaces/${workspaceId}/Tasks/${taskId}`

                if (event.data.exists()) {
                        updated = event.data.val();
                        user = updated.updatedByUser;

                        if (user == undefined || user == null || user == "CASCADES_CLOUD") {
                                console.log('Exiting due to user being empty or CASCADES_CLOUD');
                                return null;
                        }
                }

                const root = event.data.ref.root;
                const previous = event.data.previous.val();
                const userid = updated.updatedBy;

                //console.log('Task Id:', event.params.taskId)
                //console.log('Original task:', original);
                console.log('Updated task:', updated);

                retrieveTaskSettings(user, workspaceId, root).then(snap => {
                        var setting_soon = 10; 
                        if (snap.exists()) {
                                const settings = snap.val();
                                //console.log('Settings:', settings, settings.soon);
                                setting_soon = settings.soon;
                        }

                        determineTaskState(updated, setting_soon, updates, updateKey);

                        if (updates.length > 0) {
                                var update = []
                                update[updateKey + "/updatedByUser"] = "CASCADES_CLOUD";  
                                updates.push(update);
                                console.log('Updates:', updates);

                                return root.update(updates);
                        }
                        

                })

                return true;
                //return event.data.ref.parent.child('uppercase').set(uppercase);
});

function retrieveTaskSettings(user, workspaceId, root) {
        return root.child(`/Users/${user}/Workspaces/${workspaceId}/Settings/Task`).once('value');
}

function determineTaskStatus(task, prev, updates) {
        /*if (edited.status == 'Done') { 
                edited.isDone = true;   
        } else {
                edited.isDone = false;   
        }
                                    
        if (edited.status != 'Not Started' && (edited.start == undefined || edited.start == null || edited.start == '')) {
                edited.start = new Date();
        }*/
}

function determineTaskState(task, settings_soon, updates, updateKey) {
        var bod = moment().startOf('day');
        var eod = moment().endOf('day');
        var soon = moment().add(settings_soon, 'days');
        
        var prev = "";
        var due = null;
        
        prev = task.state;
        due = (task.due == undefined || task.due == null) ? null : moment(task.due);
        
        if (task.isDone) {
                task.state = 'Done';
        } else if (due == null) {
                task.state = 'No due date';
        } else if (due < bod) {
                task.state = 'Overdue';
        } else if (due >= bod && due <= eod) {
                task.state = 'Due today';
        } else if (due < soon) {
                task.state = 'Due soon';			
        } else {
                task.state = 'Due later';
        }
        
        //console.log("Prev state:", prev, " Curr state:", task.state);
        if (prev != task.state) {
                var update = [];
                update[updateKey + "/state"] = task.state;
                updates.push(update);
        }
        
};
