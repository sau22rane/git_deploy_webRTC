// getting dom elements
var divSelectRoom = document.querySelector("#RoomSelection");
var divConsultingRoom = document.querySelector("#consultingRoom");
var inputRoomNumber = document.querySelector("#roomNumber");
var btnGoRoom = document.querySelector("#goRoom");
var localVideo = document.querySelector("#localVideo");

var count = 0;

// var localVideoText = document.querySelector("#local-video-text");

// var muteBtn = document.querySelector("#mute-button");
// var vdoBtn = document.querySelector("#video-pause");
var endCallBtn = document.querySelector("#end-call-button");

var flag = 0;
var length = 0;
var socketId;
var remoteVideo =[]
// var remoteVideoText =[]
// remoteVideo.push(document.querySelector("#remoteVideo1"));
// remoteVideo.push(document.querySelector("#remoteVideo2"));

var offerCreated = false;
var ready = false;

// variables
var Client_IDs = [];
var roomNumber;
var localStream;

var configuration = { iceServers: [{
    urls: "stun:stun.services.mozilla.com",
    username: "louis@mozilla.com", 
    credential: "webrtcdemo"
}]
};

var rtcPeerConnection = [];
// var rtcPeerConnection[length]1 = new RTCPeerConnection[length](configuration);
var streamConstraints = { audio: true, video: true };
var isCaller;

// Let's do this
var socket = io();
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;

endCallBtn.onclick = function(){
    localStream.getTracks()[0].enabled = false;
    localStream.getTracks()[1].enabled = false;

    socket.emit('end_connection', {
            id: socketId, 
            rn: roomNumber
        });
    
    while(rtcPeerConnection.length!=0){
        rtcPeerConnection[0].close();
        rtcPeerConnection.shift();
    }
}

// muteBtn.onclick = function () {
//     var state = localStream.getTracks()[0].enabled;
//     localStream.getTracks()[0].enabled = !state;
//     document.querySelector("#mic-icon").classList.toggle("fa-microphone-slash");
//     document.querySelector("#mic-icon").classList.toggle("fa-microphone");
// }

// vdoBtn.onclick = function () {
//     var state = localStream.getTracks()[1].enabled;
//     localStream.getTracks()[1].enabled = !state;
//     document.querySelector("#video-icon").classList.toggle("fa-video-slash");
//     document.querySelector("#video-icon").classList.toggle("fa-video");
// }

btnGoRoom.onclick = function () {
    if (inputRoomNumber.value === '') {
        alert("Please type a room number")
    } else {
        roomNumber = inputRoomNumber.value;
        socket.emit('create or join', roomNumber);
        divSelectRoom.style = "display: none;";
        divConsultingRoom.style = "display: visible;";
    }
    // var i = 0;
    // while (i<6) {
    //     remoteVideo.push(document.querySelector("#remoteVideo"+i));
    //     i++;
    // }
    // remoteVideo.push(document.querySelector("#remote-video"));
    // remoteVideoText.push(document.querySelector("#remote-video-text"));
};

// message handlers
socket.on('created', function (room) {
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        
        localVideo.srcObject = stream;
        // localVideoText.innerHTML = ' <span class="dot"></span> Connected';
        // localVideoText.style.color="rgb(125, 255, 3)"
        isCaller = true;
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
    isInitiator = true;
    console.log("created "+ socket.id);
    socketId = socket.id;
});


socket.on('joined', function (room) {
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        // localVideoText.innerHTML = ' <span class="dot"></span> Connected';
        // localVideoText.style.color="rgb(125, 255, 3)"
        socket.emit('ready', {
            rn: roomNumber,
            id: socketId
        }
        );
        ready = true;
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
    isChannelReady = true;
    socketId = socket.id;
    console.log("joined "+socketId);
});

socket.on('message', function(message) {
    //console.log('Client received message:', message);
  });




socket.on('end_connection', function(event) {
    var indx = Client_IDs.indexOf(event.id);
    rtcPeerConnection[indx].close();
    remoteVideo[indx].remove();
    Client_IDs.splice(indx, 1);
    rtcPeerConnection.splice(indx, 1);
    remoteVideo.splice(indx, 1);
});


socket.on('candidate', function (event) {
    if(!Client_IDs.includes(event.from)){

        Client_IDs.push(event.from);
        var candidate = new RTCIceCandidate({
            sdpMLineIndex: event.label,
            candidate: event.candidate
        });
        rtcPeerConnection[length].addIceCandidate(candidate);
        console.log("recieved candidate from: jjj "+event.from);
    }
    
    
});

socket.on('ready', function (event) {
    offerCreated = true;
    console.log("Ready Here: "+event.id+" "+socketId);

    // document.querySelector("#create_offer").addEventListener("click", function(){
        if (event.id!=socketId) {
            

            var tag = document.createElement("video");
            tag.id = "remoteVideo"+count;
            tag.autoplay = true;
            tag.style.height="300px";
            tag.style.width="300px";
            document.querySelector("#consultingRoom").appendChild(tag);        
            remoteVideo.push(document.querySelector("#remoteVideo"+count));


        count++;
            var temp = event.id;
            console.log("Creating Offer ");
            length = rtcPeerConnection.length;
            rtcPeerConnection.push(new RTCPeerConnection(configuration));
            rtcPeerConnection[length].onicecandidate = function(event, t = temp) {
                if (event.candidate) {
                    console.log('sending ice candidate');
                    socket.emit('candidate', {
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate,
                        room: roomNumber,
                        from: socketId,
                        to: t
                    })
            
                console.log('to: ttttt '+temp);
                }
            };

            rtcPeerConnection[length].ontrack = function (event, t = temp) {
                // while(Client_IDs.indexOf(t) === -1);
                remoteVideo[length].srcObject = event.streams[0];

                // remoteVideoText[length].innerHTML = ' <span class="dot"></span> Connected';
                // remoteVideoText[length].style.color="rgb(125, 255, 3)";
                console.log('got user media');
                console.log(rtcPeerConnection);
                console.log(remoteVideo);    
            };    
            rtcPeerConnection[length].addTrack(localStream.getTracks()[0], localStream);
            rtcPeerConnection[length].addTrack(localStream.getTracks()[1], localStream);
            rtcPeerConnection[length].createOffer()
                .then(sessionDescription => {
                    rtcPeerConnection[length].setLocalDescription(sessionDescription);
                    socket.emit('offer', {
                        type: 'offer',
                        sdp: sessionDescription,
                        room: roomNumber,
                        id: socketId
                    });
                })
                .catch(error => {
                    console.log(error)
                });
            
            console.log(rtcPeerConnection[length]); 
            sendMessage('answer');
        }
    // });
});

socket.on('offer', function (event) {
    ready = false;
    console.log("Offer Here: "+event.id+" "+socketId);
    console.log("Creating Answer ");
    if (!isCaller) {
        if(!Client_IDs.includes(event.id)){

            Client_IDs.push(event.id);

            var tag = document.createElement("video");
            tag.id = "remoteVideo"+count;
            tag.autoplay = true;
            tag.style.height="300px";
            tag.style.width="300px";
            document.querySelector("#consultingRoom").appendChild(tag);

            remoteVideo.push(document.querySelector("#remoteVideo"+count));
            count++;
        }
        var temp = event.id;
        length = rtcPeerConnection.length;
        rtcPeerConnection.push(new RTCPeerConnection(configuration));

        rtcPeerConnection[length].onicecandidate = function(event, t = temp) {
            if (event.candidate) {
                console.log('sending ice candidate');
                socket.emit('candidate', {
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                    room: roomNumber,
                    from: socketId,
                    to: t
                })
        
            console.log('to: ttttt '+temp);
            }
        };

        var ind = Client_IDs.indexOf(event.id);

        rtcPeerConnection[ind].ontrack = function(event, t = ind) {
            remoteVideo[t].srcObject = event.streams[0];

            // remoteVideoText[t].innerHTML = ' <span class="dot"></span> Connected';
            // remoteVideoText[t].style.color="rgb(125, 255, 3)";
            console.log('got user media');
            console.log(rtcPeerConnection);
            console.log(remoteVideo);    
        };
        rtcPeerConnection[ind].addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection[ind].addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection[ind].setRemoteDescription(new RTCSessionDescription(event.sdp));
        rtcPeerConnection[ind].createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection[ind].setLocalDescription(sessionDescription);
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber,
                    to: event.id
                });
            })
            .catch(error => {
                console.log(error)
            })
            console.log('Offer Recieved');
        console.log(rtcPeerConnection); 
        console.log(Client_IDs); 
        console.log('Sending Answer');
    }
});

socket.on('answer', function (event) {
    offerCreated = false;
    console.log('Answer Recieved '+length);
    rtcPeerConnection[length].setRemoteDescription(new RTCSessionDescription(event.sdp));
    console.log(rtcPeerConnection);
    console.log(remoteVideo);
})

// handler functions
function onIceCandidate(event) {
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber,
            from: socketId
        })

    sendMessage('sentIcecadidate');
    }
}

function onAddStream(event) {
    remoteVideo[0].srcObject = event.streams[0];
    console.log('got user media');
    console.log(rtcPeerConnection);
    console.log(remoteVideo);    
}

function sendMessage(message) {
    socket.emit('message', message);
}


window.addEventListener('beforeunload', function (e) {
    // e.preventDefault();
    // e.returnValue = '';
    localStream.getTracks()[0].enabled = false;
    localStream.getTracks()[1].enabled = false;

    socket.emit('end_connection', {
            id: socketId, 
            rn: roomNumber
        });
    
    while(rtcPeerConnection.length!=0){
        rtcPeerConnection[0].close();
        rtcPeerConnection.shift();
    } 
});