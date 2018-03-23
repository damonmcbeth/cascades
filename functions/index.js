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

                //Get Task Settings
                //Check Schedule Status
                //Check Done State
                //Save Activity
                //Calc Stats
                //Notify

                //const updated = event.data.val();
                //const original = event.data.previous.val();

                //console.log('Task Id:', event.params.taskId)
                //console.log('Original task:', original);
                //console.log('Updated task:', updated);
                
                //determineTaskState(updated)

                return true;
                //return event.data.ref.parent.child('uppercase').set(uppercase);
});

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

//exports.cleanUpUserActivity = functions.database.ref('/App/Workspaces/{workspaceId}/UserActivity/{userId}/{userActivityId}')
//    .onWrite(event => {
        // Grab the current value of what was written to the Realtime Database.
//        const original = event.data.val();
//        console.log('Cleaning', event.params.userId, original);

        //const uppercase = original.toUpperCase();
        // You must return a Promise when performing asynchronous tasks inside a Functions such as
        // writing to the Firebase Realtime Database.
        // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
        //return event.data.ref.parent.child('uppercase').set(uppercase);
//    });
