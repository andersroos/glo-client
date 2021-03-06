import sprintf from 'sprintf';
import {ajax} from "jquery";
import {MAX_PORT} from "./api";
import {MIN_PORT} from "./api";

 
export let State = {
    INIT: 'init',
    FAIL: 'fail',
    GOOD: 'good',
    WAIT: 'wait',
    SCAN: 'scan',
};


export class Item {
    
    constructor(timestamp, item) {
        let [path, tags] = item.key.split(":", 2);
        this.key = item.key;
        this.path = path.split("/");
        this.tags = tags.split("-");
        this.value = item.value;
        this.desc = item.desc;
        this.lvl = item.lvl;
        this.timestamp = timestamp;
        this.computed = null;
    }

    update(timestamp, value) {

        if (this.tags.indexOf('count') != -1) {
            this.computed = sprintf("%f/s", Math.round((value - this.value) / (timestamp - this.timestamp)));
        }
        this.value = value;
        this.timestamp = timestamp;
    }
}


// Represents a server with hostport that may or may not be connected.
export class ServerBase {

    // Create a server. For a standard server it will be hostport.
    constructor(app, host, port) {
        this.app = app;
        this.host = host;
        this.port = port || 0;
        this.spec = sprintf("%s:%d", this.host, this.port);

        this.items = {};

        this.failCount = 0;
        this.state = State.INIT;
    }

    // Update will be called periodically, on update the server is expected to try to update the data. If not //
    // connected it should try to connect, until max retries are reached. A scanning server may start its scan on
    // update. The server will decide if it should do anything or not.
    update() {
        // Find alternative to jsonp with jquery, maybe require CORS from servers, or find another lib.
        ajax({
                 type:     "GET",
                 dataType: "json",
                 url:      sprintf("http://%s:%d/?callback=?", this.host, this.port),
                 success:  this.success.bind(this),
                 error:    this.fail.bind(this),
                 timeout:  500,
             });
    }

    success(res) {
        this.failCount = 0;
        this.state = State.GOOD;
        
        if (res.version !== 4) {
            throw new Error(sprintf("%s exepcted version 4, was %s", this.spec, res.version))
        }
        
        res.items.forEach((item) => {
            let existing = this.items[item.key];
            if (existing) {
                existing.update(res.timestamp, item.value);
            }
            else {
                this.items[item.key] = new Item(res.timestamp, item);
            }
        });
        
        this.app.render();
    }

    fail() {
        this.failCount++;
        this.state = State.FAIL;
        this.app.render();
    }
}

export class Server extends ServerBase {

}


// Fake server that generates random data and sometimes disconnects.
export class FakeServer extends ServerBase {

    constructor(app, port) {
        super(app, "fake", port || 22200);
        
        this.res = {
            version: 4,
            items: [
                {
                    key: "/localhost/gloserver/request:count",
                    value: 0,
                    desc: "Number of requests to the server.",
                    level: 0
                },
                {
                    key: "/localhost/gloserver/cache/size:current",
                    value: 100,
                    desc: "Size of the cache.",
                    level: 0
                }
            ]
        };
    }
    
    update() {
        this.res.timestamp = new Date().getTime() * 1000;
        this.res.items[0].value += Math.round(2 + Math.random() * 4);
        this.res.items[1].value = Math.round(100 + Math.random() * 20);
        if (Math.random() > 0.5) {
            setTimeout(() => this.success(this.res), 100);
        }
        else {
            setTimeout(() => this.fail(), 100);
        }
    }
}

// Searches for servers on host and all ports.
export class ServerDiscover {

    constructor(app, host) {
        this.app = app;
        this.host = host;
        this.spec = host;
        this.in_progess = 0;
        this.items = {};
        this.state = State.INIT;
        this.wait = 0;
    }

    update() {
        this.wait--;
        if (this.in_progess || this.wait >= 0) {
            this.state = State.WAIT + " " + this.wait;
            return;
        }
        this.wait = 10;
        this.state = State.SCAN;

        for (let port = MIN_PORT; port <= MAX_PORT; ++port) {
            const spec = sprintf("%s:%d", this.host, port);
            if (!this.app.servers.get(spec)) {
                this.in_progess++;
                ajax({
                         type:     "GET",
                         dataType: "json",
                         url:      sprintf("http://%s:%d/?callback=?", this.host, port),
                         success:  this.success.bind(this, port),
                         error:    this.fail.bind(this, port),
                         timeout:  500,
                     });
            }
        }
    }

    success(port, res) {
        this.in_progess--;

        if (!res.version) {
            // Probably not glo.
            return;
        }

        this.app.servers.add(new Server(this.app, this.host, port));
        this.app.render();
    }

    fail() {
        this.in_progess--;
    }
}


// Servers structure, holds all Server/HostScanner and FakeServer instances. Key is host or hostport.
export class Servers {
    constructor() {
        this.collection = {}
    }

    // Add server to collection.
    add(server) {
        let spec = server.spec;
        if (spec in this.collection) {
            // TODO Add error message area on page.
            console.error(sprintf("server '%s' already exists", spec));
            return;
        }
        this.collection[spec] = server;
    }

    // Return server matching spec.
    get(spec) {
        return this.collection[spec];
    }

    // Return all servers in order.
    all() {
        return Object.values(this.collection).sort(s => s.spec);
    }

    // Let all servers get the chance to update.
    update() {
        Object.values(this.collection).forEach(s => s.update());
    }
}
