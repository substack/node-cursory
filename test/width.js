var test = require('tap').test;
var EventEmitter = require('events').EventEmitter;
var cursory = require('../');
var seq = require('seq');

test('width', function (t) {
    var pos = cursory(10);
    
    seq()
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            // abcde*
            t.equal(pos.x, 6);
            t.equal(pos.y, 1);
            pos.write(new Buffer('fghij'));
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            // abcdefghij
            // *
            t.equal(pos.x, 1);
            t.equal(pos.y, 2);
            pos.write(new Buffer('klmn'));
            this();
        })
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            // abcdefghij
            // klmn*
            t.equal(pos.x, 5);
            t.equal(pos.y, 2);
            pos.end();
            t.end();
        })
    ;
    pos.write(new Buffer('abcde'));
});
