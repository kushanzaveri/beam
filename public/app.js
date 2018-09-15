// reference: https://github.com/muaz-khan/RTCMultiConnection/blob/master/docs/api.md

let connection = null;
let myVideoId = null;
let myVideo = null;
let myRoomId = null;

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

    let canvas = document.getElementById('canvas');

    var userKey = "gay";

    //joinRoom('atharvas1-room');
};

function initializeConnection() {
    connection = new RTCMultiConnection();
    connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

    let options = {
        localMediaConstraints: {
            audio: true,
            video: true
        },
        onGettingLocalMedia: stream => {
            console.log(stream);
            myVideoId = stream.streamid;
            console.log(myVideoId);
        },
        onLocalMediaError: err => console.error('error: ' + err)
    };

    connection.videosContainer = document.getElementById('videos-container');
    console.log("c " + connection.videosContainer);
    connection.getUserMediaHandler(options);
}

function leaveRoom() {
    // to leave entire room
    connection.getAllParticipants().forEach(participantId => {
        connection.disconnectWith(participantId);
    });
}

function joinRoom(roomId) {
    console.log('tryna join ' + roomId);

    initializeConnection();
    connection.openOrJoin(roomId, (inRoomAlready, roomid) => {
        // leave current room
        leaveRoom();

        console.log('in rm ' + roomid);
        myRoomId = roomid;
        myVideo = document.querySelector('video');
        myVideo.id = myVideoId;
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
}

function endCall() {
    firebase.database().ref('calls/' + userKey).remove();
    //firebase.database.ref('calls/' + user2).remove();
}

function getPartner() {
    return firebase.database().ref('calls/' + userKey + '/partnerID').once('value');
}

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
        "returnFaceAttributes":
            "age,gender,headPose,smile,facialHair,glasses,emotion," +
            "hair,makeup,occlusion,accessories,blur,exposure,noise"
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
        return new Blob([raw], { type: contentType });
    }
    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}
