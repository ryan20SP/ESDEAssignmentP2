const express = require('express');
const serveStatic = require('serve-static');
var app = express();
var hostname = "localhost";
var port = 3001;

var https = require("https")
var fs = require("fs")

app.use(function (req, res, next) {
    console.log(req.url);
    console.log(req.method);
    console.log(req.path);
    console.log(req.query.id);
    //Checking the incoming request type from the client
    if (req.method != "GET") {
        res.type('.html');
        var msg = '<html><body>This server only serves web pages with GET request</body></html>';
        res.end(msg);
    } else {
        next();
    }
});

app.use(serveStatic(__dirname + "/public"));

app.get("/", (req, res) => {
    res.sendFile("/public/home.html", { root: __dirname });
});

https.createServer({
    key: fs.readFileSync('../server.key'),
    cert: fs.readFileSync('../server.cert')
}, app)
    .listen(port, function () {
        console.log(`Server is Listening on: https://localhost:${port}/`)
    })