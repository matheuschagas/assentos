var app = require('express')();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);

var clients = {};

app.get('/', function(req, res){
    res.sendFile(__dirname+'/src/index.html')
});

//SocketIO vem aqui

http.listen(process.env.PORT || 3003, function(){
    console.log('listening on port 3003');
});

io.on("connection", function (client) {
    client.on("join", function(name){
        console.log("Joined: " + name);
        clients[client.id] = name;
        client.emit("update", "You have connected to the server.");
        client.broadcast.emit("update", name + " has joined the server.")
    });

    client.on("send", function(msg){
        console.log("Message: " + msg);
        client.broadcast.emit("seatUpdate", clients[client.id], msg);
    });

    client.on("disconnect", function(){
        console.log("Disconnect");
        io.emit("update", clients[client.id] + " has left the server.");
        delete clients[client.id];
    });
});