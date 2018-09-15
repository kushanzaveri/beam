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
            myVideoId = stream.streamid;
            console.log(myVideoId);
        },
        onLocalMediaError: err => console.error('error: ' + err)
    };

    connection.videosContainer = document.getElementById('videos-container');
    console.log("c " + connection.videosContainer);
    connection.getUserMediaHandler(options);

    // kushan replace 'bornas-room' with the room finding logic
    connection.openOrJoin('bornas-room', (isRoomExists, roomid) => {
        myRoomId = roomid;
        myVideo = document.getElementById(myVideoId);

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