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
            emit();
        }
        else if (last === 'D') {
            var s = buf.slice(0, buf.length - 1).toString();
            pos.x -= parseInt(s, 10) || 1;
            emit();
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
    
    binary(stream).loop(function (end) {
        this
            .word8('c')
            .tap(function (vars) {
                if (vars.c === '\n'.charCodeAt(0)) {
                    pos.y ++;
                    pos.x = 0;
                    emit();
                }
                else if (vars.c === '\r'.charCodeAt(0)) {
                    pos.x = 0;
                    emit();
                }
                else if (vars.c === '\f'.charCodeAt(0)) {
                    pos.y ++;
                    emit();
                }
                else if (vars.c === 0x1b) { // escape
                    this
                        .word8('x')
                        .tap(function (vars) {
                            if (vars.x === '['.charCodeAt(0)) {
                                this
                                    .loop(nextAlpha('values'))
                                    .word8('__hack')
                                    .tap(function (vars) {
                                        decode(vars.values);
                                    })
                                ;
                            }
                            else if (vars.x === '('.charCodeAt(0)
                            || vars.x === ')'.charCodeAt(0)
                            || vars.x === 'c'
                            ) { /* nop */ }
                            else if (vars.x === '7'.charCodeAt(0)) {
                                stack.push({ x : pos.x, y : pos.y });
                            }
                            else if (vars.x === '8'.charCodeAt(0)) {
                                var p = stack.pop();
                                pos.x = p.x;
                                pos.y = p.y;
                                emit();
                            }
                            else if (vars.x === 'D'.charCodeAt(0)) {
                                // scroll down
                                pos.x = 0;
                                pos.y ++;
                                emit();
                            }
                            else if (vars.x === 'M'.charCodeAt(0)) {
                                // scroll up
                                pos.x = 0;
                                pos.y --;
                                emit();
                            }
                            else {
                                pos.x += 2;
                                xcheck() || emit();
                            }
                        })
                    ;
                }
                else {
                    pos.x ++;
                    xcheck() || emit();
                }
            })
        ;
    });
    
    function nextAlpha (name) {
        var values = [];
        
        return function (end) {
            this
                .word8('__nextChar')
                .tap(function (vars) {
                    var c = vars.__nextChar;
                    values.push(c);
                    if (String.fromCharCode(c).match(/[A-Za-z]/)) {
                        vars[name] = new Buffer(values);
                        end();
                    }
                })
            ;
        }
    }
    
    var pos = new EventEmitter;
    pos.x = 0;
    pos.y = 0;
    return pos;
};
