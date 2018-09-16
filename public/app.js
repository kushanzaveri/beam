// reference: https://github.com/muaz-khan/RTCMultiConnection/blob/master/docs/api.md

let SMILE = 0.95;

let connection = null;
let myVideo = null;
let aicanvas = null;
let userKey = "gabe";
let randomRm = "uscus";
//let joinedRandom = false;
let cnt = 1;
let playing = false;
let countingFrames = false;
let framesPast = 0;
let FRAMES = 20;
let iSmiled = false;
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

    aicanvas = document.getElementById('aicanvas');

    randomRm = Math.floor(Math.random() * 1000000);
    console.log(randomRm);
    joinRoom(randomRm);

    firebase.database().ref('calls/').on("child_added", function (childSnapshot, prevChildKey) {
        if (childSnapshot.key === userKey) {
            console.log(userKey + ' is joining room ID ' + childSnapshot.child('roomID').val());
            playing = true;
            framesPast = 0;
            countingFrames = false;
            iSmiled = false;

            document.getElementById("init-overlay").style.background = "rgba(0,0,0,0)"
            joinRoom(childSnapshot.child('roomID').val());
        }
    });




    firebase.database().ref('calls/').on("child_removed", function (oldChildSnapshot) {
        if (oldChildSnapshot.key === userKey) {
            console.log("user " + userKey + " is leaving roomID " + oldChildSnapshot.child('roomID').val());
            playing = false;
            framesPast = 0;
            countingFrames = false;
            iSmiled = false;
            leaveRoom();
        }
    });


    firebase.database().ref('results/').on("child_added", function (childSnapshot, prevChildKey) {
        if (playing) {
            if (iSmiled) {
                console.log("YOU LOST");
                playing = false;
                iSmiled = false;
            } else {
                console.log("YOU WON");
                playing = false;
                iSmiled = false;
            }
        }
    });
};

function initializeConnection() {
    connection = new RTCMultiConnection();
    //connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';
    connection.socketURL = 'https://polar-island-71747.herokuapp.com/';
    connection.videosContainer = document.getElementById('videos-container');
    let options = {
        localMediaConstraints: {
            audio: false,
            video: true
        },
        onGettingLocalMedia: stream => console.log('got local stream ready'),
        onLocalMediaError: err => console.error('error: ' + err)
    };

    connection.onstream = e => {
        var parentNode = connection.videosContainer;
        e.mediaElement.className += 'your-video img-responsive';
        e.mediaElement.removeAttribute('controls');
        parentNode.insertBefore(e.mediaElement, parentNode.firstChild);
        var played = e.mediaElement.play();

        if (typeof played !== 'undefined') {
            played.catch(function () { /*** iOS 11 doesn't allow automatic play and rejects ***/ }).then(function () {
                setTimeout(function () {
                    e.mediaElement.play();
                }, 2000);
            });
            return;
        }

        setTimeout(function () {
            e.mediaElement.play();
        }, 2000);
    };

    console.log("c " + connection.videosContainer);
    connection.getUserMediaHandler(options);
}

function leaveRoom() {
    document.getElementById("connect").style.display = "block"
    document.getElementById("init-overlay").style.background = "rgba(255, 180, 0, 0.75)"
    playing = false;
    framesPast = 0;
    countingFrames = false;
    iSmiled = false;
    // to leave entire room
    connection.getAllParticipants().forEach(participantId => {
        connection.disconnectWith(participantId);
        console.log('disconnect from user ' + participantId);
    });

    connection.close();
}

function joinRoom(roomId) {
    console.error('caleed ' + cnt);
    cnt = cnt + 1;


    console.log('tryna join ' + roomId);

    let container = document.getElementById('videos-container');

    while (container.firstChild) {
        console.log('delete ' + container.firstChild.id);
        container.removeChild(container.firstChild);
    }

    initializeConnection();
    connection.openOrJoin(roomId, (roomExists, roomid) => {
        console.log('in rm ' + roomid);

        let localStream = connection.streamEvents.selectFirst({
            local: true
        });



        console.log('local stream ' + JSON.stringify(localStream));

        myVideo = document.getElementById(localStream.streamid);
        myVideo.className += ' my-video';

        console.log('here');

        aicanvas.height = myVideo.videoHeight;
        aicanvas.width = myVideo.videoWidth;

        let ctx = aicanvas.getContext('2d');

        myVideo.ontimeupdate = () => {
            ctx.drawImage(myVideo, 0, 0, aicanvas.width, aicanvas.height);
            let data = aicanvas.toDataURL('image/png');

            if (playing || countingFrames) {
                processImage(data);
            }
        };
    });
}

function connectPress() {

    userKey = firebase.database().ref('waiting/').push(
        "gabe"
    ).key;

    document.getElementById("connect").style.display = "none"

    firebase.database().ref('waiting/').once("value")
        .then(function (dataSnapshot) {
            const amount = dataSnapshot.numChildren();

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
    var newID = firebase.database().ref('rooms').push("gay").key;

    firebase.database().ref('calls/' + userKey).set({
        roomID: newID
    });
    firebase.database().ref('calls/' + partner).set({
        roomID: newID
    });
    firebase.database().ref('rooms/' + newID).set({
        user1: partner,
        user2: userKey
    })
    firebase.database().ref('waiting/' + userKey).remove();
    firebase.database().ref('waiting/' + partner).remove();
    //joinRoom(partner);
}

function endCall() {
    firebase.database().ref('calls/' + userKey + '/roomID/').once('value')
        .then(function (data) {
            //console.log("woah the partner is " + dataSnapshot.key + " " + dataSnapshot.val());
            console.log("user " + userKey + " is ending call in room " + data.val());
            // Remove user1 from the room
            firebase.database().ref('rooms/' + data.val() + '/user1/').once('value')
                .then(function (user) {
                    console.log('adfadsfasdf user1 ' + user.val());
                    firebase.database().ref('calls/' + user.val()).remove();
                });
            // Remove user2 from the room
            firebase.database().ref('rooms/' + data.val() + '/user2/').once('value')
                .then(function (user) {
                    console.log('adfadsfasdf user2 ' + user.val());
                    firebase.database().ref('calls/' + user.val()).remove();
                });
            // Remove the room
            //firebase.database().ref('rooms/' + data.val()).remove();
        });
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
            beforeSend: function (xhrObj) {
                xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
                xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
            },

            type: "POST",
            processData: false,
            // Request body.
            data: mkblob(dataURL),
        })

        .done(function (data) {
            // Show formatted JSON on webpage.
            //document.getElementById('face-data').innerHTML = JSON.stringify(data, null, 2);
            //var strr = (JSON.stringify(data));
            //var objj = JSON.parse(strr);

            if (countingFrames) {
                framesPast++;
                console.log(framesPast)
                if (framesPast === 1) {
                    firebase.database().ref('results/').push("bar");
                }
                if (framesPast >= FRAMES) {
                    console.log("games over boys");

                    framesPast = 0;
                    countingFrames = false;

                    endCall();
                }
            }

            if ((data.length == 0 || data[0].faceAttributes.smile >= SMILE) && playing) {
                // var body = document.createElement("p");

                console.log("YOU LOSE BRO")

                playing = false;
                iSmiled = true;
                countingFrames = true;
            }
        })

        .fail(function (jqXHR, textStatus, errorThrown) {
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