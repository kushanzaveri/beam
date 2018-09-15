// reference: https://github.com/muaz-khan/RTCMultiConnection/blob/master/docs/api.md
window.onload = () => {
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
            console.log(JSON.stringify(data, null, 2));
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
    connection.openOrJoin('atharvas1-room', (isRoomExists, roomid) => {
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

            processImage(data);
            // borna
        };
    });
};