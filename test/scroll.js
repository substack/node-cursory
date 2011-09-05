var test = require('tap').test;
var EventEmitter = require('events').EventEmitter;
var cursory = require('../');
var seq = require('seq');
var charmer = require('charm');

test('scroll', function (t) {
    var stream = new EventEmitter;
    stream.write = function (buf) {
        this.emit('data', buf);
    };
    
    stream.readable = true;
    stream.writable = true;
    
    var charm = charmer(stream);
    var pos = cursory(stream);
    
    seq()
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            t.equal(pos.x, 13);
            t.equal(pos.y, 0);
            this();
        })
        .seq(function () {
            pos.once('pos', this.ok);
            charm.down(3);
        })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            t.equal(pos.x, 13);
            t.equal(pos.y, 3);
            this();
        })
        .seq(function () {
            pos.once('pos', this.ok);
            charm.left(3).up(2);
        })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            t.equal(pos.x, 10);
            t.equal(pos.y, 1);
            stream.emit('end');
            t.end();
        })
    ;
    
    charm
        .right(8)
        .write(new Buffer('abcde'))
    ;
});
