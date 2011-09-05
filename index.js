var binary = require('binary');
var EventEmitter = require('events').EventEmitter;

module.exports = function (stream, width) {
    if (width === undefined) width = 80;
    
    function decode (buf) {
        console.dir(buf);
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
                                this.loop(nextAlpha('values')).tap(function (vars) {
                                    decode(vars.values);
                                });
                            }
                        })
                    ;
                }
                else {
                    pos.x ++;
                    emit();
                }
            })
        ;
    });
    
    function nextAlpha (name) {
        var values = [];
        
        return function (end) {
            this
                .get('__nextChar')
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
