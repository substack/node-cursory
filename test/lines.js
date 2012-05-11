var test = require('tap').test;
var EventEmitter = require('events').EventEmitter;
var cursory = require('../');
var seq = require('seq');

test('lines', function (t) {
    var pos = cursory();
    
    seq()
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            t.equal(pos.x, 3);
            t.equal(pos.y, 0);
            process.nextTick(function () {
                pos.write(new Buffer('\n'));
            });
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            t.equal(pos.x, 0);
            t.equal(pos.y, 1);
            pos.write(new Buffer('defg\fhi'));
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            t.equal(pos.x, 6);
            t.equal(pos.y, 2);
            pos.write(new Buffer('jk\rl'));
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            t.equal(pos.x, 1);
            t.equal(pos.y, 2);
            pos.end();
            t.end();
        })
    ;
    pos.write(new Buffer('abc'));
});
