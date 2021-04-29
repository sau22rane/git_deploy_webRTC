//requires
const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var room_owner;
var new_client;
var numClients;
var Clients = [];

const port = process.env.PORT || 3000;

// express routing
app.use(express.static('public'));


// signaling
io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('create or join', function (room) {
        console.log('create or join to room ', room);
        
        var myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
        numClients = myRoom.length;

        console.log(room, ' has ', numClients, ' clients');
        console.log(socket.id+" joined");
        Clients.push(socket.id);
        if (numClients == 0) {
            socket.join(room);
            room_owner = socket.id;
            socket.emit('created', room);
        } else if (numClients <= 6) {
            socket.join(room);
            // socket.emit('joined', room);
            new_client = socket.id;
            // io.to(room_owner).emit('owner', room);
            io.to(new_client).emit('joined', room);
        } else {
            socket.emit('full', room);
        }
    });

    socket.on('ready', function (event){
        socket.broadcast.to(event.rn).emit('ready', event);
        //io.to(room_owner).emit('ready');
        //io.to(socket.id).emit('ready');
    });

    socket.on('candidate', function (event){
        // socket.broadcast.to(event.room).emit('candidate', event,numClients);
        io.to(event.to).emit('candidate', event);
        // io.to(event.from).emit('candidate', event);
        console.log("sending to "+event.to+" and "+event.from);
        // io.to(socket.id).emit('candidate', event);
    });

    socket.on('offer', function(event){
        // socket.broadcast.to(event.room).emit('offer',event.sdp,numClients);
        //io.to(room_owner).emit('offer',event.sdp,numClients);
        io.to(new_client).emit('offer',event);
    });

    socket.on('answer', function(event){
        // socket.broadcast.to(event.room).emit('answer',event.sdp,numClients);
        io.to(event.to).emit('answer',event);
        //io.to(new_client).emit('answer',event.sdp,numClients);
    });

    socket.on('end_connection', function(event){
        socket.broadcast.to(event.rn).emit('end_connection', event);
    })

});

// listener
http.listen(port || 3000, function () {
    console.log('listening on', port);
});