var express = require('express'),
    app = express(),
    path = require('path'),
    request = require('request'),
    _ = require('underscore'),
    child_process = require('child_process'),
    hostname = process.env.HOSTNAME || 'localhost',
    cheerio = require('cheerio'),

    // port = process.env.PORT || 4567,
    publicDir = process.argv[2] || __dirname + '/public',
    favicon = require('serve-favicon'),
    fs = require('fs');

var tpl = _.template(fs.readFileSync("public/template.html").toString())
var linktpl = _.template('<a href="page/<%= page %>"><h6><%= page %></h6></a><br>')

// config = require('./config');
function genContent(seed, cb) {
    var child = child_process.exec('cd .. ; th sample.lua cv/currentmodel.t7 -gpuid -1 -verbose 0 -temperature .'+_.random(30, 99).toString()+' -length ' + _.random(300, 4000).toString() + ' -primetext "' + seed + ' is " > wikiScrape/page/"' + seed + '"');
    child.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
    });
    child.stderr.on('data', function(data) {
        console.log('stdout: ' + data);
    });
    child.on('close', function(code) {
        console.log('closing code: ' + code);
        cb()
    });

}
// genContent(console.log)
// http: //en.wikipedia.org/wiki
var createServer = function(port) {

    app.use(favicon(__dirname + '/favicon.ico'));


    app.get('/', function(req, res) {

        fs.readdir('page', (err, files) => {

            res.set('Content-Type', 'text/html');
            res.send(tpl({
                page: 'Voynich',
                content: _.map(files, (file) => {
                    return linktpl({
                        page: file
                    })
                }).join(' ');
            }));


        })


    })

    function buildPage(data, page) {
        var regex = new RegExp('http[s]?://en.wikipedia.org/wiki/', "g");
        data = data.toString().replace(regex, "")

        return tpl({
            page: page.replace("/page/", ""),
            content: data
        })
    }

    app.get('/page/*', function(req, res) {
        console.log(req.url)
        var filename = req.url.slice(1);
        res.set('Content-Type', 'text/html');

        fs.readFile(filename, function(err, data) {
            if (err) {
                genContent(req.url.replace("/page/", ""), () => {
                    console.log("called")
                    fs.readFile(filename, function(err, data) {
                        if (err) {
                            throw err;
                        }

                        res.send(buildPage(data, req.url));
                    });
                })

            } else //file exists, send it
                res.send(buildPage(data, req.url));

        });
    })

    app.use('/static/', express.static(path.join(__dirname, 'public')));

    var server = app.listen(port, function() {

        var host = server.address().address;
        var port = server.address().port;

        console.log('Voynich listening at http://%s:%s', host, port);

    });
};

module.exports = createServer;

createServer(80)
