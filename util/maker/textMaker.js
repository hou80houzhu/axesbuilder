var fs = require("fs");
var hash = require("../md5");
var brooder = require("../brooder");
var file = require("../file");
var textPacker = function (info, path, content) {
    this._base = info;
    this._path = path;
    this._content = content;
};
textPacker.prototype.minify = function () {
    this._minify = this._content;
    this._hash = hash.md5(this._minify);
    file(this._path).write(this._minify);
};
var textMaker = function (option) {
    console.log("-->[text] start build text files...");
    var files = option.source.text;
    var queue = brooder.queue();
    var ps = brooder.promise();
    queue.complete(function () {
        ps.resolve();
    });
    for (var i in files) {
        queue.add(function (a, b) {
            console.log("---->build text file path of " + b);
            var thss = this;
            file(b.path).read().done(function (data) {
                var p = new textPacker(option, option.newPath + b.path.substring(option.basePath.length), data);
                p.minify();
                option.sourceMapping.text[b.packet] = p._hash;
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
module.exports = textMaker;