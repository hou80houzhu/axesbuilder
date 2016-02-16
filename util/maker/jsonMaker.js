var fs = require("fs");
var hash = require("../md5");
var packet = require("../packet");
var file = require("../file");
var jsonPacker = function (info, path, content) {
    this._base = info;
    this._path = path;
    this._content = content;
};
jsonPacker.prototype.minify = function () {
    this._minify = JSON.stringify(JSON.parse(this._content));
    this._hash = hash.md5(this._minify);
    file(this._path).write(this._minify);
};
var jsonMaker = function (option) {
    console.log("-->[json] start build json files...");
    var files = option.source.json;
    var queue = packet.queue();
    var ps = packet.promise();
    queue.complete(function () {
        ps.resolve();
    });
    for (var i in files) {
        queue.add(function (a, b) {
            console.log("---->build json file path of " + b.path);
            var thss = this;
            file(b.path).read().done(function (data) {
                var p = new jsonPacker(option, option.newPath + b.path.substring(option.basePath.length), data);
                p.minify();
                option.sourceMapping.json[b.packet] = p._hash;
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
module.exports = jsonMaker;