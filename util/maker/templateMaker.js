var fs = require("fs");
var hash = require("../md5");
var brooder = require("../brooder");
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

var templatePacker = function (info, packet, path, content) {
    this._base = info;
    this._path = path;
    this._packet = packet;
    this.content = content;
    templatePacker.getTemplateInfo.call(this);
};
templatePacker.isNote = /\/\*[\w\W]*?\*\//;
templatePacker.isInfo = /@([\s\S]*?);/g;
templatePacker.i = /\r\n/g;
templatePacker.k = /\r/g;
templatePacker.l = /\n/g;
templatePacker.f = />[\s]+</g;
templatePacker.isNotet = /\<\!\-\-\[@[\s\S]*?;\]\-\-\>/;
templatePacker.isNotets = /\<\!\-\-\[@[\s\S]*?;\]\-\-\>/g;
templatePacker.isNotec = /\<\!\-\-[\s\S]*?\-\-\>/g;
templatePacker.isNotep = /\<\!\-\-\[[0-9a-zA-Z-_]*?\]\-\-\>/;
templatePacker.replaceHtmlPath = function (code) {
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
templatePacker.getTemplateInfo = function () {
    var info = {};
    var content = this.content.replace(templatePacker.f, "><").replace(templatePacker.i, "").replace(templatePacker.k, "").replace(templatePacker.l, "");
    info.packet = this._packet;
    info.content = content;
    info.note = "<!--[@packet " + this._packet + ";]-->";
    this._info = info;
};
templatePacker.prototype.minify = function () {
    this._minify = this._info.content;
    this._minify = templatePacker.replaceHtmlPath.call(this, this._minify);
    this._hash = hash.md5(this._minify);
    file(this._path).write(this._minify);
};
templatePacker.prototype.getCompressStr = function () {
    return this._info.note + this._minify + "\r\n";
};
var templateMaker = function (option) {
    console.log("-->[template] start build template files...");
    var files = option.source.template;
    var queue = brooder.queue();
    var ps = brooder.promise();
    queue.complete(function () {
        ps.resolve();
    });
    for (var i in files) {
        queue.add(function (a, b) {
            console.log("---->build template file path of " + b.path);
            var thss = this;
            file(b.path).read().done(function (data) {
                var p = new templatePacker(option, b.packet, option.newPath + b.path.substring(option.basePath.length), data);
                p.minify();
                if (p._info.packet) {
                    option.sourceMapping.template[p._info.packet] = p._hash;
                }
                if (option.tmpCompressWithout && option.tmpCompressWithout.indexOf(p._info.packet) === -1) {
                    option.templateCompress += p.getCompressStr();
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
module.exports = templateMaker;