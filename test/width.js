var test = require('tap').test;
var EventEmitter = require('events').EventEmitter;
var cursory = require('../');
var seq = require('seq');

test('width', function (t) {
    var stream = new EventEmitter;
    var pos = cursory(stream, 10);
    
    seq()
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            t.equal(pos.x, 5);
            t.equal(pos.y, 0);
            stream.emit('data', new Buffer('fghij'));
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            t.equal(pos.x, 0);
            t.equal(pos.y, 1);
            stream.emit('data', new Buffer('klmn'));
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
    stream.emit('data', new Buffer('abcde'));
});
