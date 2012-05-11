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
            t.equal(pos.x, 4);
            t.equal(pos.y, 1);
            process.nextTick(function () {
                pos.write(new Buffer('\n'));
            });
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            // abc\n
            // *
            t.equal(pos.x, 1);
            t.equal(pos.y, 2);
            pos.write(new Buffer('defg\fhi'));
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            // abc\n
            // defg\f
            //     hi*
            t.equal(pos.x, 7);
            t.equal(pos.y, 3);
            pos.write(new Buffer('jk\rl'));
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            // abc\n
            // defg\f
            // l*
            t.equal(pos.x, 2);
            t.equal(pos.y, 3);
            pos.end();
            t.end();
        })
    ;
    pos.write(new Buffer('abc'));
});
