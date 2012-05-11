var binary = require('binary');
var EventEmitter = require('events').EventEmitter;
var Stream = require('stream').Stream;

module.exports = function (opts) {
    if (opts === undefined) opts = {};
    if (typeof opts === 'number') {
        opts = { width : opts };
    }
    var width = opts.width;
    
    var stack = [];
    var pos = new Stream;
    pos.writable = true;
    pos.readable = true;
    
    pos.x = opts.x || 1;
    pos.y = opts.y || 1;
    
    var bin = binary();
    pos.write = bin.write.bind(bin);
    pos.end = bin.end.bind(bin);
    
    function decode (buf) {
        var last = String.fromCharCode(buf[buf.length - 1]);
        
        var handler = {
            s : function (s, b) {
                // push stack without attributes
                stack.push({ x : pos.x, y : pos.y });
            },
            u : function (s, b) {
                // pop stack without attributes
                var p = stack.pop();
                pos.x = p.x;
                pos.y = p.y;
                emit(b);
            },
            A : function (s, b) {
                // relative up
                pos.y -= parseInt(s, 10) || 1;
                emit(b);
            },
            B : function (s, b) {
                // relative down
                pos.y += parseInt(s, 10) || 1;
                emit(b);
            },
            C : function (s, b) {
                // relative right
                pos.x += parseInt(s, 10) || 1;
                xcheck();
                emit(b);
            },
            D : function (s, b) {
                // relative left
                pos.x -= parseInt(s, 10) || 1;
                xcheck();
                emit(b);
            },
            E : function (s, b) {
                // begining of the line N lines down
                pos.x = 1;
                pos.y += parseInt(s, 10) || 1;
                emit(b);
            },
            F : function (s, b) {
                // begining of the line N lines up
                pos.x = 1;
                pos.y -= parseInt(s, 10) || 1;
                emit(b);
            },
            G : function (s, b) {
                // absolute column
                pos.x = parseInt(s, 10) || 1;
                xcheck();
                emit(b);
            },
            H : function (s, b) {
                // absolute x,y
                var xy = s.split(';');
                pos.x = parseInt(xy[0], 10) || 1;
                pos.y = parseInt(xy[1], 10) || 1;
                xcheck();
                emit(b);
            },
            f : function (s, b) {
                // absolute x,y
                var xy = s.split(';');
                pos.x = parseInt(xy[0], 10) || 1;
                pos.y = parseInt(xy[1], 10) || 1;
                xcheck();
                emit(b);
            },
        }[last];
        
        if (handler) {
            var b = buf.slice(0, buf.length - 1);
            handler(b.toString(), b);
        }
    }
    
    function xcheck () {
        if (width && pos.x >= width) {
            pos.y += Math.floor(pos.x / width);
            pos.x = pos.x % width;
        }
    }
    
    var emit = (function () {
        var nt = false;
        return function (buf) {
            pos.emit('data', buf);
            pos.emit('pos', pos.x, pos.y);
        };
    })();
    
    bin.tap(function parse () {
        this
        .word8('c')
        .tap(function (vars) {
            var c = vars.c;
            var b = new Buffer([vars.c]);
            if (c === '\n'.charCodeAt(0)) {
                pos.y ++;
                pos.x = 1;
                emit(b);
                parse.call(this);
            }
            else if (c === '\r'.charCodeAt(0)) {
                pos.x = 1;
                emit(b);
                parse.call(this);
            }
            else if (c === '\f'.charCodeAt(0)) {
                pos.y ++;
                emit(b);
                parse.call(this);
            }
            else if (c === 0x1b) { // escape
                this
                    .word8('x')
                    .tap(function (vars) {
                        var x = String.fromCharCode(vars.x);
                        if (x === '[') {
                            this.tap(nextAlpha(function () {
                                parse.call(this);
                            }));
                        }
                        else if (x === '(' || x === ')' || x === 'c') {
                            parse.call(this);
                        }
                        else if (x === '7') {
                            stack.push({ x : pos.x, y : pos.y });
                            parse.call(this);
                        }
                        else if (x === '8') {
                            var p = stack.pop();
                            pos.x = p.x;
                            pos.y = p.y;
                            emit(b);
                            parse.call(this);
                        }
                        else if (x === 'D') {
                            // scroll down
                            pos.x = 1;
                            pos.y ++;
                            emit(b);
                            parse.call(this);
                        }
                        else if (x === 'M') {
                            // scroll up
                            pos.x = 1;
                            pos.y --;
                            emit(b);
                            parse.call(this);
                        }
                        else {
                            pos.x += 2;
                            xcheck() || emit(b);
                            parse.call(this);
                        }
                    })
                ;
            }
            else {
                pos.x ++;
                xcheck() || emit(b);
                parse.call(this);
            }
        })
    });
    
    function nextAlpha (cb) {
        var values = [];
        return function alpha () {
            this
                .word8('__nextChar')
                .tap(function (vars) {
                    var c = vars.__nextChar;
                    values.push(c);
                    if (String.fromCharCode(c).match(/[A-Za-z]/)) {
                        decode(new Buffer(values));
                        cb.call(this);
                    }
                    else alpha.call(this);
                })
            ;
        };
    }
    
    return pos;
};
