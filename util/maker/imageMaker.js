var fs = require("fs");
var hash = require("../md5");
var axes = require("../axes");
var file = require("../file");
function createFile(dirpath, fn) {
    if (!fs.existsSync(dirpath)) {
        var pathtmp = "";
        var a = dirpath.split("/");
        for (var i = 0; i < a.length - 1; i++) {
            pathtmp += a[i];
            if (!fs.existsSync(pathtmp)) {
                fs.mkdirSync(pathtmp);
            }
            pathtmp += "/";
        }
        pathtmp = pathtmp + "/" + a[a.length - 1];
        fs.open(pathtmp, "w", function () {
            fn && fn();
        });
    } else {
        fn && fn();
    }
}
var imagePacker = function (info, path, content) {
    this._base = info;
    this._path = path;
    this._content = content;
};
imagePacker.prototype.minify = function () {
    this._minify = this._content;
    this._hash = hash.md5(this._minify);
    var path = this._path, ths = this;
    var old = this._base.basePath + path.substring(this._base.newPath.length);
    createFile(path, function () {
        fs.stat(old, function (err, st) {
            if (err) {
            } else if (st.isFile()) {
                readable = fs.createReadStream(old);
                writable = fs.createWriteStream(path);
                readable.pipe(writable);
            }
        });
    });
};
var imageMaker = function (option) {
    console.log("-->[image] start build images files...");
    var files = option.source.image;
    var queue = axes.queue();
    var ps = axes.promise();
    queue.complete(function () {
        ps.resolve();
    });
    for (var i in files) {
        queue.add(function (a, b) {
            var thss = this;
            console.log("---->build image file path of " + b.path);
            file(b.path).read().done(function (data) {
                var p = new imagePacker(option, option.newPath + b.path.substring(option.basePath.length), data);
                p.minify();
                option.sourceMapping.image[b.packet] = p._hash;
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
module.exports = imageMaker;