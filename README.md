# Glo #

## About ##

Javascrip client for Glo servers.

## Usage ##

`<glo html>?<host>:<port>&<host>:<port>&...`

Example: `file:///tmp/glo.html?localhost:22200&localhost:22201`

If port is omitted it will scan ports from 22200 to 22240 and show all
servers it finds.

Example: `file:///tmp/glo.html?localhost`

To get random fake data you can also use the special host "fake".

Example: `file:///tmp/glo.html?fake:123&fake:321`
