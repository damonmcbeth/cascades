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

                // Exit when the data is deleted.
                if (!event.data.exists()) {
                        return null;
                }

                const workspaceId = event.params.workspaceId;
                const root = event.data.ref.root;

                const updated = event.data.val();
                const previous = event.data.previous.val();

                const user = updated.updatedByUser;
                const userid = updated.updatedBy;

                //console.log('Task Id:', event.params.taskId)
                //console.log('Original task:', original);
                console.log('Updated task:', updated);

                retrieveTaskSettings(user, workspaceId, root).then(snap => {
                        console.log('Settings:', snap.val());
                })
                //determineTaskState(updated)

                return true;
                //return event.data.ref.parent.child('uppercase').set(uppercase);
});

function retrieveTaskSettings(user, workspaceId, root) {
        return root.child(`/Users/${user}/Workspaces/${workspaceId}/Settings/Task`).once('value');
}

function cleanUp(task) {
        return
}

function determineTaskState(task) {
        var bod = moment().startOf('day');
        var eod = moment().endOf('day');
        var soon = moment().add(5, 'days');
        //var soon = moment().add(globalSettings.currPreferences.Settings.Task.soon, 'days');
        
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
        
        console.log("Prev state:", prev, " Curr state:", task.state);
        if (prev != task.state) {
                
        }
        
};
