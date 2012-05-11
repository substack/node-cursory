var test = require('tap').test;
var EventEmitter = require('events').EventEmitter;
var cursory = require('../');
var seq = require('seq');
var charmer = require('charm');

test('scroll', function (t) {
    var charm = charmer();
    var pos = cursory();
    charm.pipe(pos);
    
    seq()
        .seq(function () { pos.once('pos', this.ok) })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            //         abcde*
            t.equal(pos.x, 14);
            t.equal(pos.y, 1);
            this();
        })
        .seq(function () {
            pos.once('pos', this.ok);
            charm.down(3);
        })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            //         abcde
            //              
            //              
            //              *
            t.equal(pos.x, 14);
            t.equal(pos.y, 4);
            this();
        })
        .seq(function () {
            pos.once('pos', this.ok);
            charm.left(3).up(2);
        })
        .seq(function () { setTimeout(this.ok, 50) })
        .seq(function () {
            //         abcde
            //           *   
            t.equal(pos.x, 11);
            t.equal(pos.y, 2);
            charm.end();
            t.end();
        })
    ;
    
    charm
        .right(8)
        .write(new Buffer('abcde'))
    ;
});
