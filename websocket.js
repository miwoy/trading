const wss = require("./lib/socket"); // wss封装
const debugFactory = require("debug");
const {stragify} = require("application")

const debug = debugFactory("ws");

wss.on('connection', function(ws) {
    ws.send({
        directive: "connect",
        data: {
            isConnect: true
        }
    });
    stragify.run((result)=> {
        ws.send({
            directive: "data",
            data: result
        })
    })
   
});

wss.on('error', function(err) {
    debug(`wss error ${err.message}`);
});

wss.logger = (ctx, data, io)=> {
    console.log(`[${new Date().toISOString()}]:${io}-`,data)
};


module.exports = wss;
