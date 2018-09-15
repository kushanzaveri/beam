// reference: https://github.com/muaz-khan/RTCMultiConnection/blob/master/docs/api.md
window.onload = () => {
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