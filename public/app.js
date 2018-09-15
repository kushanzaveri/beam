// reference: https://github.com/muaz-khan/RTCMultiConnection/blob/master/docs/api.md
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

    var userKey = "gay";

    
    let connection = new RTCMultiConnection();
    connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

    let myVideoId = null;
    let myVideo = null;
    let myRoomId = null;
    let canvas = document.getElementById('canvas');

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

    // kushan replace 'bornas-room' with the room finding logic
    connection.openOrJoin('atharvas2-room', (isRoomExists, roomid) => {
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


            // borna
        };
    });
};

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