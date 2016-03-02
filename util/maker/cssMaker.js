var fs = require("fs");
var hash = require("../md5");
var bright = require("../bright");
var uglifycss = require('uglifycss');
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
var cssPacker = function (info, packet, path, content) {
    this._path = path;
    this._base = info;
    this._packet = packet;
    this.content = content;
    cssPacker.getCssInfo.call(this);
};
cssPacker.isNote = /\/\*[\w\W]*?\*\//;
cssPacker.isInfo = /@([\s\S]*?);/g;
cssPacker.isUrl = /url\(.+?\)/g;
cssPacker.getCssInfo = function () {
    var info = {};
    info.packet = this._packet;
    info.note = "/** * @packet " + this._packet + "; */";
    this._info = info;
};
cssPacker.writeResource = function () {
    var c = this._path.split("/"), ths = this;
    c.splice(c.length - 1, 1);
    var current = c.join("/");
    this._minify = this._minify.replace(cssPacker.isUrl, function (a) {
        var r = "";
        var bb = a.substring(4, a.length - 1).replace(/'/g, "").split("?");
        var b = bb[0];
        var c = bb[1] ? "?" + bb[1] : "";
        var suffix = b.split(".");
        if (suffix.length > 1) {
            suffix = suffix[suffix.length - 1];
        } else {
            suffix = "";
        }
        var old = ths._base.basePath + current.substring(ths._base.newPath.length) + "/" + b;
        var k = b.split("/");
        k.splice(k.length - 1, 1);
        var t = k.join("/");
        try {
            var data = fs.readFileSync(old);
            var name = hash.md5(data);
            var newpath = current + "/" + t + "/" + name + "." + suffix;
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
                r = "url('" + t + "/" + name + "." + suffix + c + "')";
            } else {
                r = "url(" + t + "/" + name + "." + suffix + c + ")";
            }
            return r;
        } catch (e) {
//            console.log(e);
            return a;
        }
    });
};
cssPacker.prototype.minify = function () {
    var go = true;
    for (var i in this._base.cssNoCompress) {
        var a = this._base.cssNoCompress[i];
        if (this._path.indexOf(a) !== -1) {
            go = false;
        }
    }
    if (go) {
        var a = uglifycss.processString(this.content, {
            uglyComments: true,
            cuteComments: true
        });
        this._minify = a;
    } else {
        this._minify = this.content;
        console.log("[brightbuilder] file " + this._path + " passed");
    }
    cssPacker.writeResource.call(this);
    this._hash = hash.md5(this._minify);
    file(this._path).write(this._minify);
};
cssPacker.prototype.getCompressStr = function () {
    if (!this._minify) {
        this.minify();
    }
    return this._info.note + this._minify + "\r\n";
};
var cssMaker = function (option, iscompress) {
    console.log("[brightbuilder] start build css files...");
    var files = option.source.css;
    if (!iscompress) {
        files = option.source.ocss;
    }
    var queue = bright.queue();
    var ps = bright.promise();
    queue.complete(function () {
        ps.resolve();
    });
    for (var i in files) {
        queue.add(function (a, b) {
            console.log("[brightbuilder] building css file path of " + b.path);
            var thss = this;
            file(b.path).read().done(function (data) {
                var p = new cssPacker(option, b.packet, option.newPath + b.path.substring(option.basePath.length), data);
                p.minify();
                option.sourceMapping.css[p._info.packet] = p._hash;
                if (iscompress && option.cssCompressWithout && option.cssCompressWithout.indexOf(p._info.packet) === -1) {
                    option.cssCompress += p.getCompressStr();
                }
                thss.next();
            });
        }, null, {
            path: files[i],
            packet: i
        });
    }
    queue.run();
    return ps;
};
module.exports = cssMaker;