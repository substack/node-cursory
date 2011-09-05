var binary = require('binary');
var EventEmitter = require('events').EventEmitter;

module.exports = function (stream, width) {
    var stack = [];
    
    function decode (buf) {
        var last = String.fromCharCode(buf[buf.length - 1]);
        if (last === 's') {
            stack.push({ x : pos.x, y : pos.y });
        }
        else if (last === 'u') {
            var p = stack.pop();
            pos.x = p.x;
            pos.y = p.y;
            emit();
        }
        else if (last === 'A') {
            var s = buf.slice(0, buf.length - 1).toString();
            pos.y -= parseInt(s, 10) || 1;
            emit();
        }
        else if (last === 'B') {
            var s = buf.slice(0, buf.length - 1).toString();
            pos.y += parseInt(s, 10) || 1;
            emit();
        }
        else if (last === 'C') {
            var s = buf.slice(0, buf.length - 1).toString();
            pos.x += parseInt(s, 10) || 1;
            xcheck() || emit();
        }
        else if (last === 'D') {
            var s = buf.slice(0, buf.length - 1).toString();
            pos.x -= parseInt(s, 10) || 1;
            xcheck() || emit();
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
                        decode(new Buffer(values))
                        cb.call(this);
                    }
                    else alpha.call(this);
                })
            ;
        };
    }
    
    var pos = new EventEmitter;
    pos.x = 0;
    pos.y = 0;
    return pos;
};
