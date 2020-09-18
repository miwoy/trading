const WebSocket = require("ws");
const debugFactory = require("debug");

const debug = debugFactory("trading:lib:socket");

/**
 * wss对象包装
 * 会将websocket库中的wss(webocket server)对象封装后提供给业务层
 *     _wss 封装的ws对象中包含源wss(wesocket server)
 *     _queue 连入的websocket client队列
 *     logger 日志打印功能
 *     use websocket server中间件配置
 *     on websocket server事件监听器，提供connection与close事件监听
 */

const wss = {
    _wss: null,
    _queue: [],
    _events: {},
    index: -1,
    logger: null,
    use: function(cb) {
        this._queue.push(cb);
    },
    on: function(event, cb) {
        let eventHandle = createHandle(event, cb);
        this._events[event] = eventHandle;
    },
    createWSS: function(http) {
        this._wss = new WebSocket.Server({ server: http });
        for (let eventName in this._events) {
            this._wss.on(eventName, this._events[eventName]);
        }
    }
};

const createHandle = function(event, cb) {
    let eventHandle;
    switch (event) {
        case "close":
        case "error":
            eventHandle = cb;
            break;
        case "connection":
            eventHandle = function(ws) {
                let index = -1;
                let _ws = {
                    _ws: ws,
                    headers: ws.upgradeReq.headers,
                    send: function (data) {

                        let _data = {
                            directive: data.directive,
                            errno: 0,
                            errmsg: "ok",
                            data: {}
                        }
                        if (data && data.errno || data instanceof Error) {
                            let errno = (typeof data.errno !== "number" || !data.errno) ? 500 : data.errno;
                            let errmsg = data.message || data.errmsg;
                            _data = {
                                directive: data.directive,
                                errno: errno,
                                errmsg: errmsg
                            }
                        } else {
                            _data.data = data.data;
                        }

                        if (wss.logger) wss.logger(this, _data, 1);

                        try {

                            // console.log("用户状态：",self.user.status)
                            this._ws.send(JSON.stringify(_data));
                        } catch (e) {
                            console.log("send err", e);
                        }

                    },
                    close: function() {
                        ws.close();
                    },
                    on: function (event, cb) {

                        if (event === "message" && wss.logger) {
                            this._ws.on(event, (data) => {
                                try {
                                    data = JSON.parse(data);
                                } catch (e) {
                                    return this._ws.send("Are you pig!" + e.message);
                                }

                                wss.logger(this, data, 0);
                                cb(data);
                            })
                        } else {
                            this._ws.on(event, cb);
                        }


                    }
                }
                let end = function() {
                    cb(_ws);
                }
                let next = function() {
                    index++;
                    if (index === wss._queue.length) return end();
                    wss._queue[index](_ws, next);

                }

                next();
            }
            break;
    }

    return eventHandle;
}

module.exports = wss;
