/**
 * Created by alex on 15.12.2016.
 */
'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const shortid = require('shortid');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();
app.set('STORAGE_DIR', path.resolve(__dirname, 'storage'));
app.set('PORT', 8000);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const category = req.body.category;
        let dest = app.get('STORAGE_DIR');
        if (category) {
            dest = path.resolve(app.get('STORAGE_DIR'), category);
            if (!fs.existsSync(dest)) fs.mkdirSync(dest)
        }

        cb(null, dest)
    },
    filename: function (req, file, cb) {
        cb(null, shortid.generate() + path.extname(file.originalname))
    }
});
const upload = multer({storage});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.post('/upload', upload.single('video'),
    function (req, res, next) {
        try {
            res.json({id: path.relative(app.get('STORAGE_DIR'), req.file.path).replace(/\\+/g, '/')});
        } catch (e) {
            next(e);
        }
    }
);
app.param('category', function (req, res, next, category) {
    req.category = category;
    next();
});
app.param('id', function (req, res, next, id) {
    if (req.category) {
        id = req.category + "/" + id;
    }
    var file = path.resolve(app.get('STORAGE_DIR'), id);
    fs.stat(file, function (err, stats) {
        if (err) {
            if (err.code === 'ENOENT') {
                // 404 Error if file not found
                return res.sendStatus(404);
            }
            res.end(err);
        }
        req.file = {
            id,
            path: file,
            stats
        }

        next()
    })
});
app.get('/view/:id', function (req, res, next) {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(`<video src="/stream/${req.file.id}" controls></video>`);
});
app.get('/view/:category/:id', function (req, res, next) {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(`<video src="/stream/${req.file.id}" controls></video>`);
});

app.get('/stream/:id', stream);
app.get('/stream/:category/:id', stream);

app.use(function (err, req, res, next) {
    console.log(err);
    res.status(500).json({message: err.message});
});

module.exports = app;

function stream(req, res, next) {
    var range = req.headers.range;
    if (!range) {
        // 416 Wrong range
        return res.sendStatus(416);
    }
    var positions = range.replace(/bytes=/, "").split("-");
    var start = parseInt(positions[0], 10);
    var total = req.file.stats.size;
    var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
    var chunksize = (end - start) + 1;

    res.writeHead(206, {
        "Content-Range": "bytes " + start + "-" + end + "/" + total,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4"
    });

    var stream = fs.createReadStream(req.file.path, {start: start, end: end})
        .on("open", function () {
            stream.pipe(res);
        })
        .on("error", function (err) {
            next(err);
        });
}