cursory
=======

Compute the relative cursor position from a stream that emits ansi events.

status
======

Escape codes that set absolute coordinates are not yet supported.

methods
=======

````javascript
var cursory = require('cursory');
````

var pos = cursory(stream, width)
--------------------------------

Create a new cursor position `pos` from a stream and optionally a window width.

The `stream` should emit 'data' events with binary `Buffer` payloads. 

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

    npm install cursory
