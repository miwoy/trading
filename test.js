#!/usr/bin/env node

var WebSocket = require('ws');
var ws = new WebSocket("ws://0.0.0.0:3000/", {
    origin: 'https://websocket.org',
    headers: {
        other: "test"
    }
});


ws.on('open', function open() {
    console.log('connected');
});

ws.on('close', function close() {
    console.log('disconnected');
});


ws.on("error", function (err) {
    console.log(err);
})

ws.on('message', function incoming(data) {
    console.log("recived from server:", data);
    data = JSON.parse(data);
});