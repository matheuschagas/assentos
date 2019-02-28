var app = require('express')();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(':assentos:');

let booked = {};

let c = console;


function populateDatabase() {
    //region create key value table
    let sql = "CREATE TABLE IF NOT EXISTS keyvalue(" +
        "key TEXT," +
        "value TEXT" +
        ")";

    db.serialize(() => {
        // queries will execute in serialized mode
        db.run(sql);
    });
    //endregion
};

function bookSeat(msg){
    try{
        booked[msg.seat] = msg;
       /* //region create key value table
        let sql = "INSERT INTO keyvalue(key, value) VALUES ('map', " + JSON.stringify(booked) + ")";

        db.serialize(() => {
            // queries will execute in serialized mode
            db.run(sql);
        });*/
        //endregion
    }catch(e){
        console.log(e);
    }

}

function unbookSeat(msg){
    try{
        booked[msg.seat] = undefined;
        //region create key value table
        /*let sql = "INSERT INTO keyvalue(key, value) VALUES ('map', " + JSON.stringify(booked) + ")";

        db.serialize(() => {
            // queries will execute in serialized mode
            db.run(sql);
        });
        //endregion*/
    }catch(e){
        console.log(e);
    }
}

function getBookedSeats(){
    return booked;
}

function resetDatabase(){
    //region delete all database data
    let sql = "DELETE FROM keyvalue";

    db.serialize(() => {
        // queries will execute in serialized mode
        db.run(sql);
    });
    //endregion
}

populateDatabase();
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
        client.emit("update", {type: 'message', message: "You have connected to the server."});
        client.emit("update", {type: 'init', booked});
        client.broadcast.emit("update", {type: 'message', message: "Joined: " + name})
    });

    client.on("send", function(msg){
        c.log("Message: " + msg);
        switch (msg.action) {
            case "deselectSeat":
                unbookSeat(msg);
                client.broadcast.emit("seatUpdate", clients[client.id], msg);
                break;
            case "selectSeat":
                bookSeat(msg);
                client.broadcast.emit("seatUpdate", clients[client.id], msg);
                break;
            case "clearDatabase":
                resetDatabase();
                booked = {};
                client.emit("clearDatabase", clients[client.id], msg);
                client.broadcast.emit("clearDatabase", clients[client.id], msg);
        }
    });

    client.on("disconnect", function(){
        console.log("Disconnect");
        io.emit("update", clients[client.id] + " has left the server.");
        delete clients[client.id];
    });
});
