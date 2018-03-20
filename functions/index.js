const functions = require('firebase-functions');

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
                const updated = event.data.val();
                const original = event.data.previous;

                //TODO: Run Clean up tasks
                //1 check if date changed or if new status is needed
                //check if closed
                //check if should notify
                //capture change log

                //console.log('Original task:', event.params.taskId, original);
                //console.log('Updated task:', updated);
                
                return true;
                //return event.data.ref.parent.child('uppercase').set(uppercase);
});

function cleanUp(task) {
        return
}

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
