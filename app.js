import 'babel-polyfill';
import {Servers, FakeServer, ServerDiscover, Server} from "./server";
import {Ui} from "./ui";
import React from 'react';
import ReactDOM from 'react-dom';
import {MIN_PORT} from "./api";


class App {
    constructor() {
        this.servers = new Servers();
    }

    render() {
        ReactDOM.render(<Ui servers={this.servers.all()}/>, document.getElementById("glo"));
    }

    add(spec) {
        let [host, port] = spec.split(":", 2);
        port = parseInt(port);


        if (host === "fake") {
            this.servers.add(new FakeServer(this, port || MIN_PORT));
        }
        else if (!port) {
            this.servers.add(new ServerDiscover(this, host));
        }
        else {
            this.servers.add(new Server(this, host, port));
        }

        this.render();
    }

    update() {
        this.servers.update();
    }
}


document.addEventListener('DOMContentLoaded', function() {

    let app = new App();

    // Parse specs from url and add as servers.

    let params = document.URL.split("?", 2)[1] || ("fake:" + MIN_PORT);
    params.split("&").forEach(spec => {
        app.add(spec);
    });
    app.update();
    setInterval(() => {
        app.update();
    }, 1000);

});
