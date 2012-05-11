cursory
=======

Compute the relative cursor position from a stream that emits ansi events.

[![build status](https://secure.travis-ci.org/substack/node-cursory.png)](http://travis-ci.org/substack/node-cursory)

status
======

Escape codes that set absolute coordinates are not yet supported.

methods
=======

````javascript
var cursory = require('cursory');
````

var pos = cursory(width)
------------------------

Return a new writable stream `pos` from an optional window width.

`pos` has attributes that update and events that fire as the screen position
state of the input stream changes.

attributes
==========

pos.x
-----

The current cursor position's relative x coordinate (column)

pos.y
-----

The current cursor position's relative y coordinate (row)

events
======

'pos', x, y
-----------

Emitted when the cursor position updates.

install
=======

```
npm install cursory
```

license
=======

MIT
