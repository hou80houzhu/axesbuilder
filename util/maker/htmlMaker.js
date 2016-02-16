var fs = require("fs");
var hash = require("../md5");
var packet = require("../packet");
var minify = require('html-minifier').minify;
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

var htmlPacker = function (info, path, content) {
    this._base = info;
    this._path = path;
    this._content = content;
    htmlPacker.minify.call(this);
};
htmlPacker.i = /\r\n/g;
htmlPacker.k = /\r/g;
htmlPacker.l = /\n/g;
htmlPacker.f = />[\s]+</g;
htmlPacker.replaceHtmlPath = function (code) {
    var ths = this;
    return code.replace(/src=['"].+?['"]/g, function (a) {
        var bb = a.substring(5, a.length - 1).split("?");

        var b = bb[0];
        var c = bb[1] ? "?" + bb[1] : "";
        var suffix = b.split(".");
        if (suffix.length > 1) {
            suffix = suffix[suffix.length - 1];
        } else {
            suffix = "";
        }

        var k = b.split("/");
        k.splice(k.length - 1, 1);
        var t = k.join("/");
        try {
            var old = ths._base.basePath + b;
            var data = fs.readFileSync(old);
            var name = hash.md5(data);

            var newpath = ths._base.newPath + t + "/" + name + "." + suffix;
            createFile(newpath, function () {
                fs.stat(old, function (err, st) {
                    if (err) {
                    } else if (st.isFile()) {
                        readable = fs.createReadStream(old);
                        writable = fs.createWriteStream(newpath);
                        readable.pipe(writable);
                    }
                });
            });
            if (a.indexOf("'") !== -1) {
                r = "src='" + t + "/" + name + "." + suffix + c + "'";
            } else {
                r = "src=\"" + t + "/" + name + "." + suffix + c + "\"";
            }
            return r;
        } catch (e) {
            return a;
        }
    });
};
htmlPacker.minify = function () {
    try {
        this._minify = minify(this._content, {
            removeComments: true,
            collapseWhitespace: true,
            minifyJS: true,
            minifyCSS: true
        });
    } catch (e) {
        this._minify = this._content.replace(htmlPacker.f, "><").replace(htmlPacker.i, "").replace(htmlPacker.k, "").replace(htmlPacker.l, "");
    }
    this._minify = htmlPacker.replaceHtmlPath.call(this, this._minify);
    this._hash = hash.md5(this._minify);
    file(this._path).write(this._minify);
};
var htmlMaker = function (option) {
    console.log("-->[html] start build html files...");
    var files = option.source.html;
    var queue = packet.queue();
    var ps = packet.promise();
    queue.complete(function () {
        ps.resolve();
    });
    for (var i in files) {
        queue.add(function (a, b) {
            var thss = this;
            console.log("---->build html file path of " + b.path);
            file(b.path).read().done(function (data) {
                var p = new htmlPacker(option, option.newPath + b.path.substring(option.basePath.length), data);
                option.sourceMapping.html[b.packet] = p._hash;
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
module.exports = htmlMaker;