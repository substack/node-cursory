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
    
    pos.x = opts.x || 0;
    pos.y = opts.y || 0;
    
    var stream = new Stream;
    stream.readable = true;
    
    pos.write = function (buf) {
        stream.emit('data', buf);
    };
    
    pos.end = function () {
        stream.emit('end');
    };
    
    function decode (buf) {
        var last = String.fromCharCode(buf[buf.length - 1]);
        
        var handler = {
            s : function (s) {
                // push stack without attributes
                stack.push({ x : pos.x, y : pos.y });
            },
            u : function (s) {
                // pop stack without attributes
                var p = stack.pop();
                pos.x = p.x;
                pos.y = p.y;
                emit();
            },
            A : function (s) {
                // relative up
                pos.y -= parseInt(s, 10) || 1;
                emit();
            },
            B : function (s) {
                // relative down
                pos.y += parseInt(s, 10) || 1;
                emit();
            },
            C : function (s) {
                // relative right
                pos.x += parseInt(s, 10) || 1;
                xcheck() || emit();
            },
            D : function (s) {
                // relative left
                pos.x -= parseInt(s, 10) || 1;
                xcheck() || emit();
            },
            E : function (s) {
                // begining of the line N lines down
                pos.x = 1;
                pos.y += parseInt(s, 10) || 1;
                emit();
            },
            F : function (s) {
                // begining of the line N lines up
                pos.x = 1;
                pos.y -= parseInt(s, 10) || 1;
                emit();
            },
            G : function (s) {
                // absolute column
                pos.x = parseInt(s, 10) || 1;
                xcheck() || emit();
            },
            H : function (s) {
                // absolute x,y
                var xy = s.split(';');
                pos.x = parseInt(xy[0], 10) || 1;
                pos.y = parseInt(xy[1], 10) || 1;
                xcheck() || emit();
            },
        }[last];
        
        if (handler) {
            var s = buf.slice(0, buf.length - 1).toString();
            handler(s);
        }
    }
    
    function xcheck () {
        if (width && pos.x >= width) {
            pos.y += Math.floor(pos.x / width);
            pos.x %= width;
            emit();
            return true;
        }
    }
    
    var emit = (function () {
        var nt = false;
        return function () {
            if (nt === false) {
                nt = true;
                process.nextTick(function () {
                    nt = false;
                    pos.emit('pos', pos.x, pos.y);
                });
            }
        };
    })();
    
    binary(stream).tap(function parse () {
        this
            .word8('c')
            .tap(function (vars) {
                var c = vars.c;
                if (c === '\n'.charCodeAt(0)) {
                    pos.y ++;
                    pos.x = 0;
                    emit();
                    parse.call(this);
                }
                else if (c === '\r'.charCodeAt(0)) {
                    pos.x = 0;
                    emit();
                    parse.call(this);
                }
                else if (c === '\f'.charCodeAt(0)) {
                    pos.y ++;
                    emit();
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
                                emit();
                                parse.call(this);
                            }
                            else if (x === 'D') {
                                // scroll down
                                pos.x = 0;
                                pos.y ++;
                                emit();
                                parse.call(this);
                            }
                            else if (x === 'M') {
                                // scroll up
                                pos.x = 0;
                                pos.y --;
                                emit();
                                parse.call(this);
                            }
                            else {
                                pos.x += 2;
                                xcheck() || emit();
                                parse.call(this);
                            }
                        })
                    ;
                }
                else {
                    pos.x ++;
                    xcheck() || emit();
                    parse.call(this);
                }
            })
        ;
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
