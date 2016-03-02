var fs = require("fs");
var hash = require("../md5");
var uglify = require("uglify-js");
var bright = require("../bright");
var file = require("../file");
var jsPacker = function (info, path, content) {
    this._base = info;
    this._path = path;
    this._content = content;
};
jsPacker.prototype.minify = function () {
    var go = true;
    for (var i in this._base.jsNoCompress) {
        var a = this._base.jsNoCompress[i];
        if (this._path.indexOf(a) !== -1) {
            go = false;
        }
    }
    if (go) {
        this._minify = uglify.minify(this._content, {
            fromString: true,
            mangle: true
        }).code;
    } else {
        this._minify = this._content;
        console.log("[brightbuilder] file " + this._path + " passed");
    }
    this._hash = hash.md5(this._minify);
    file(this._path).write(this._minify);
};
var jsMaker = function (option) {
    console.log("[brightbuilder] start build js files...");
    var files = option.source.js;
    var queue = bright.queue();
    var ps = bright.promise();
    queue.complete(function () {
        ps.resolve();
    });
    for (var i in files) {
        queue.add(function (a, b) {
            console.log("[brightbuilder] build js file path of " + b.path);
            var thss = this;
            file(b.path).read().done(function (data) {
                var p = new jsPacker(option, option.newPath + b.path.substring(option.basePath.length), data);
                p.minify();
                option.sourceMapping.js[b.packet] = p._hash;
                thss.next();
            });
        }, null, {
            packet: i,
            path: files[i]
        });
    }
    queue.run();
    return ps;
};
module.exports = jsMaker;