var test = require('tap').test;
var EventEmitter = require('events').EventEmitter;
var cursory = require('../');
var seq = require('seq');
var charmer = require('charm');

test('color width', function (t) {
    var stream = new EventEmitter;
    stream.write = function (buf) {
        this.emit('data', buf);
    };
    
    stream.readable = true;
    stream.writable = true;
    
    var charm = charmer(stream);
    var pos = cursory(stream, 10);
    
    seq()
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            t.equal(pos.x, 5);
            t.equal(pos.y, 0);
            charm
                .foreground('red')
                .write(new Buffer('fghij'))
            ;
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            t.equal(pos.x, 0);
            t.equal(pos.y, 1);
            charm
                .background('yellow')
                .write(new Buffer('klmn'))
            ;
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            t.equal(pos.x, 4);
            t.equal(pos.y, 1);
            stream.emit('end');
            t.end();
        })
    ;
    
    charm
        .display('bright')
        .write(new Buffer('abcde'))
    ;
});