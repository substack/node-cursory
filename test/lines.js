var test = require('tap').test;
var EventEmitter = require('events').EventEmitter;
var cursory = require('../');
var seq = require('seq');

test('lines', function (t) {
    var stream = new EventEmitter;
    var pos = cursory(stream);
    
    seq()
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 10) })
        .seq(function () {
            t.equal(pos.x, 3);
            t.equal(pos.y, 0);
            stream.emit('data', new Buffer('\n'));
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 10) })
        .seq(function () {
            t.equal(pos.x, 0);
            t.equal(pos.y, 1);
            stream.emit('data', new Buffer('defg\fhi'));
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 10) })
        .seq(function () {
            t.equal(pos.x, 6);
            t.equal(pos.y, 2);
            stream.emit('data', new Buffer('jk\rl'));
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 10) })
        .seq(function () {
            t.equal(pos.x, 1);
            t.equal(pos.y, 2);
            stream.emit('end');
            t.end();
        })
    ;
    stream.emit('data', new Buffer('abc'));
});
