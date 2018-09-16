// reference: https://github.com/muaz-khan/RTCMultiConnection/blob/master/docs/api.md

let SMILE = 0.95;

let connection = null;
let myVideoId = null;
let myVideo = null;
let myRoomId = null;
let canvas = null;
let userKey = "gabe";

window.onload = () => {
    var config = {
        apiKey: "AIzaSyA8Rgk_fcVf5PjClZLqd33iOhLE8kMSpVY",
        authDomain: "beam-me.firebaseapp.com",
        databaseURL: "https://beam-me.firebaseio.com",
        projectId: "beam-me",
        storageBucket: "beam-me.appspot.com",
        messagingSenderId: "656185450955",
    };
    firebase.initializeApp(config);

    canvas = document.getElementById('canvas');

    let randomRm = Math.random() * 6969696969696969 + '';
    console.log(randomRm);
    joinRoom(randomRm);
};

function initializeConnection() {
    connection = new RTCMultiConnection();
    //connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';
    connection.socketURL = 'https://polar-island-71747.herokuapp.com/';
    connection.videosContainer = document.getElementById('videos-container');

    let options = {
        localMediaConstraints: {
            audio: true,
            video: true
        },
        onGettingLocalMedia: stream => {
            myVideoId = stream.streamid;
            console.log(myVideoId);
        },
        onLocalMediaError: err => console.error('error: ' + err)
    };

    console.log("c " + connection.videosContainer);
    connection.getUserMediaHandler(options);
}

function leaveRoom() {
    // to leave entire room
    connection.getAllParticipants().forEach(participantId => {
        connection.disconnectWith(participantId);
        console.log('disconnect from user ' + participantId);
    });
}

function joinRoom(roomId) {
    console.log('tryna join ' + roomId);

    if (connection) {
        leaveRoom();
    }

    initializeConnection();
    connection.openOrJoin(roomId, (roomExists, roomid) => {        
        console.log('in rm ' + roomid);
        myRoomId = roomid;
        
        if (myVideo) {
            myVideo.remove();
        }

        myVideo = document.getElementById(myVideoId);
        myVideo.className += "my-video";
        myVideo.removeAttribute('controls');
        console.log('here');

        canvas.height = myVideo.videoHeight;
        canvas.width = myVideo.videoWidth;

        let ctx = canvas.getContext('2d');

        myVideo.ontimeupdate = () => {
            ctx.drawImage(myVideo, 0, 0, canvas.width, canvas.height);
            let data = canvas.toDataURL('image/png');
            //processImage(data);
        };
    });
}

function connectPress() {

    userKey = firebase.database().ref('waiting/').push(
        document.getElementById("name").value
    ).key;

    firebase.database().ref('calls/').on("child_added", function (childSnapshot, prevChildKey) {
        if (childSnapshot.key === userKey) {
            joinRoom(userKey);
        }
    });

    firebase.database().ref('calls/').on("child_removed", function (oldChildSnapshot) {
        if (oldChildSnapshot.key === userKey) {
            console.log("leaving" + oldChildSnapshot.key)
            leaveRoom();
        }
    });

    firebase.database().ref('waiting/').once("value")
        .then(function (dataSnapshot) {
            const amount = dataSnapshot.numChildren();

            console.log(userKey + " " + document.getElementById("name").value);
            console.log(amount);

            if (amount > 1) {
                firebase.database().ref('waiting/').once('value', function (snapshot) {
                    snapshot.forEach(function (childSnapshot) {
                        partnerKey = childSnapshot.key
                        var childData = childSnapshot.val()
                        console.log("starting call betweem: " + partnerKey + " " + childData)
                        startCall(partnerKey)
                        return true
                    });
                });
                //console.log(getPartner());
                //endCall();
            }
        });
}

function startCall(partner) {
    firebase.database().ref('calls/' + userKey).set({
        partnerID: partner
    });
    firebase.database().ref('calls/' + partner).set({
        partnerID: userKey
    });
    firebase.database().ref('waiting/' + userKey).remove();
    firebase.database().ref('waiting/' + partner).remove();
    joinRoom(partner);
}

function endCall() {
    firebase.database().ref('calls/' + userKey + '/partnerID/').once('value')
        .then(function(a) {
            //console.log("woah the partner is " + dataSnapshot.key + " " + dataSnapshot.val());
            console.log("ending call with " + a.val());
            firebase.database().ref('calls/' + a.val()).remove();
        });

    firebase.database().ref('calls/' + userKey).remove();
    //leaveRoom();
}

/*function getPartner() {
    var result = 'AAHHHHH';
    //console.log("woah the userkey is " + userKey);
    firebase.database().ref('calls/' + userKey + '/partnerID/').once('value')
        .then(function(dataSnapshot) {
            //console.log("woah the partner is " + dataSnapshot.key + " " + dataSnapshot.val());
            result = dataSnapshot.val();
        });
    return result;
}*/

function processImage(dataURL) {
    // Replace <Subscription Key> with your valid subscription key.
    var subscriptionKey = "4b4a4313a0344226832054d4322c6f7c";

    // NOTE: You must use the same region in your REST call as you used to
    // obtain your subscription keys. For example, if you obtained your
    // subscription keys from westus, replace "westcentralus" in the URL
    // below with "westus".
    //
    // Free trial subscription keys are generated in the westcentralus region.
    // If you use a free trial subscription key, you shouldn't need to change
    // this region.
    var uriBase =
        "https://eastus.api.cognitive.microsoft.com/face/v1.0/detect";

    // Request parameters.
    var params = {
        "returnFaceId": "true",
        "returnFaceLandmarks": "false",
        "returnFaceAttributes": "smile,emotion" 
    };

    // Display the image.
    //var sourceImageUrl = document.getElementById("inputImage").value;
    //document.querySelector("#sourceImage").src = sourceImageUrl;

    // Perform the REST API call.
    $.ajax({
        url: uriBase + "?" + $.param(params),

        // Request headers.
        beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("Content-Type","application/octet-stream");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
        },

        type: "POST",
        processData:false,
        // Request body.
        data: mkblob(dataURL),
    })

    .done(function(data) {
        // Show formatted JSON on webpage.
        //document.getElementById('face-data').innerHTML = JSON.stringify(data, null, 2);
        //var strr = (JSON.stringify(data));
        //var objj = JSON.parse(strr);
        if (data.length == 0 || data[0].faceAttributes.smile >= SMILE) {
            // you lose bro
        }
    })

    .fail(function(jqXHR, textStatus, errorThrown) {
        // Display error message.
        var errorString = (errorThrown === "") ?
            "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ?
            "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
                jQuery.parseJSON(jqXHR.responseText).message :
                    jQuery.parseJSON(jqXHR.responseText).error.message;
        console.log(errorString);

    });


};

function mkblob(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = decodeURIComponent(parts[1]);
        return new Blob([raw], {
            type: contentType
        });
    }
    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {
        type: contentType
    });
}