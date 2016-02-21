var uglify = require("uglify-js");
var hash = require("../md5");
var axes = require("../axes");
var file = require("../file");
var pather = require("../path");
var packetInfo = function () {
    this._packets_ = {};
    this._depends = [];
    this.children = [];
    this.packet = "";
    this.require = [];
    this.include = [];
    this.template = [];
    this.js = [];
    this.css = [];
    this.html = [];
    this.json = [];
    this.image = [];
    this.text = [];
    this.usestrict = false;
};
var packetPacker = function (option, path, content) {
    this.option = option;
    this.note = "";
    this.content = content;
    this._isPacket = true;
    this._path = path;
    this._packetInfo = packetPacker.getPacketInfo.call(this);
};
packetPacker.isNote = /\/\*[\w\W]*?\*\//;
packetPacker.issuffix = /\[.*\]/g;
packetPacker.isInfo = /@([\s\S]*?);/g;
packetPacker.isdot = /\./g;
packetPacker.getPacketInfo = function () {
    var a = this.content.match(packetPacker.isNote), basepath = this.option.basePath, n = new packetInfo();
    if (a && a.length > 0) {
        var b = a[0];
        this.note = b;
        var tp = b.match(packetPacker.isInfo);
        if (tp && tp.length > 0) {
            for (var o = 0; o < tp.length; o++) {
                var a = tp[o];
                var d = a.split(" ");
                if (d.length >= 2) {
                    var key = d[0].substring(1, d[0].length), value = d[1][d[1].length - 1] === ";" ? d[1].substring(0, d[1].length - 1) : d[1], suffix = null;
                    if (!n[key]) {
                        n[key] = [];
                    }
                    var u = value.match(packetPacker.issuffix);
                    if (u) {
                        suffix = u[0].substring(1, u[0].length - 1);
                    }
                    var t = value.split(":");
                    if (t.length > 1) {
                        var mt = t[t.length - 1];
                        if (key !== "image") {
                            mt = mt.replace(packetPacker.issuffix, "");
                        }
                        n._packets_[mt] = t[0];
                        t.splice(t.length - 1, 1);
                        value = t.join(":");
                    } else {
                        var m = t[0].split("\.");
                        var mt = m[m.length - 1];
                        if (key !== "image") {
                            mt = mt.replace(packetPacker.issuffix, "");
                        }
                        n._packets_[mt] = t[0];
                    }
                    switch (key) {
                        case "packet":
                            n.packet = value.replace(packetPacker.issuffix, "");
                            n["path"] = basepath + n.packet.replace(packetPacker.isdot, "/") + ".js";
                            break;
                        case "require":
                            value = {
                                packet: value.replace(packetPacker.issuffix, ""),
                                path: "",
                                value: null
                            };
                            n._depends.push(t[0]);
                            n.children.push(t[0]);
                            value.path = basepath + t[0].replace(packetPacker.issuffix, "").replace(packetPacker.isdot, "/") + ".js";
                            break;
                        case "include":
                            value = {
                                packet: value.replace(packetPacker.issuffix, ""),
                                path: "",
                                value: null
                            };
                            n.children.push(t[0]);
                            value.path = basepath + t[0].replace(packetPacker.issuffix, "").replace(packetPacker.isdot, "/") + ".js";
                            break;
                        case "json":
                            value = {
                                packet: value.replace(packetPacker.issuffix, ""),
                                path: basepath + value.replace(packetPacker.issuffix, "").replace(packetPacker.isdot, "/") + ".json",
                                value: null
                            };
                            break;
                        case "template":
                            value = {
                                packet: value.replace(packetPacker.issuffix, ""),
                                path: basepath + value.replace(packetPacker.issuffix, "").replace(packetPacker.isdot, "/") + ".html",
                                value: null
                            };
                            break;
                        case "html":
                            value = {
                                packet: value.replace(packetPacker.issuffix, ""),
                                path: basepath + value.replace(packetPacker.issuffix, "").replace(packetPacker.isdot, "/") + ".html",
                                value: null
                            };
                            break;
                        case "image":
                            value = {
                                packet: value,
                                path: basepath + value.replace(packetPacker.issuffix, "").replace(packetPacker.isdot, "/") + (suffix ? "." + suffix : ".png"),
                                value: null
                            };
                            break;
                        case "text":
                            value = {
                                packet: value.replace(packetPacker.issuffix, ""),
                                path: basepath + value.replace(packetPacker.issuffix, "").replace(packetPacker.isdot, "/") + ".txt",
                                value: null
                            };
                            break;
                        case "css":
                            value = {
                                packet: value.replace(packetPacker.issuffix, ""),
                                path: "",
                                value: null
                            };
                            if (value.packet.indexOf("http") === -1) {
                                if (value.packet.indexOf("/") === -1) {
                                    value.path = basepath + value.packet.replace(packetPacker.issuffix, "").replace(packetPacker.isdot, "/") + ".css";
                                } else {
                                    value.path = basePath + value.packet;
                                }
                            }
                            break;
                        case "js":
                            value = {
                                packet: value.replace(packetPacker.issuffix, ""),
                                path: "",
                                value: null
                            };
                            if (value.packet.indexOf("http") === -1) {
                                if (value.packet.indexOf("/") === -1) {
                                    value.path = basepath + value.packet.replace(packetPacker.issuffix, "").replace(packetPacker.isdot, "/") + ".js";
                                } else {
                                    value.path = basePath + value.packet;
                                }
                            }
                            break;
                        default:
                            n[key] = value;
                            break;
                    }
                    if (n[key].indexOf(value) === -1) {
                        n[key].push(value);
                    }
                }
            }
        } else {
            this._isPacket = false;
        }
    } else {
        this._isPacket = false;
    }
    if (this._isPacket === false) {
        var p = this._path.substring(this.option.basePath.length, this._path.length - 3).split("/");
        n.packet = p.join(".");
        n.js = [{
                packet: n.packet,
                path: this._path
            }];
        this._isPacket = false;
    }
    return n;
};
packetPacker.prototype.isPacket = function () {
    return this._isPacket;
};
packetPacker.prototype.minify = function () {
    var code = "";
    if (this.isPacket()) {
        code = uglify.minify(this.content, {
            fromString: true,
            mangle: true
        }).code;
        code = this.note + code;
        this.code = code;
        this._packetInfo.hash = hash.md5(this.code);
        file(this.option.newPath + this._path.substring(this.option.basePath.length)).write(this.code);
    }
    return code;
};

var minite = function (option, key, keyy, keyyy) {
    var r = [];
    var array = option.mapping[key];
    var obj = option.source[keyy];
    if (!option.source[keyyy]) {
        option.source[keyyy] = {};
    }
    for(var i in array){
        var path=array[i],has=false;
        for(var t in obj){
            var opath=obj[t];
            if(path===opath){
                has=true;
                break;
            }
        }
        if(!has){
            r.push(path);
        }
    }
    for (var i in r) {
        var suffix = pather(r[i]).suffix();
        var packet = r[i].substring(option.basePath.length, r[i].length - suffix.length).split("/").join(".");
        option.source[keyyy][packet] = r[i];
    }
};

var packetMaker = function (option) {
    console.log("-->[code] start build code files...");
    var files = option.mapping.js;
    var queue = axes.queue();
    var ps = axes.promise();
    queue.complete(function () {
        minite(option, "js", "code", "js");
        minite(option, "css", "css", "ocss");
        minite(option, "html", "template", "html");
        minite(option, "text", "text", "text");
        minite(option, "image", "image", "image");
        minite(option, "json", "json", "json");
        minite(option, "other", "other", "other");
        option.mapping=null;
        ps.resolve();
    });
    for (var i = 0; i < files.length; i++) {
        queue.add(function (a, b) {
            console.log("---->build code file path of " + b);
            var thss = this;
            file(b).read().done(function (data) {
                var p = new packetPacker(option, b, data);
                if (p.isPacket()) {
                    p.minify();
                    option.sourceMapping.code[p._packetInfo.packet] = p._packetInfo.hash;
                    if (option.codeCompressWithout && option.codeCompressWithout.indexOf(p._packetInfo.packet) === -1) {
                        option.codeCompress += p.code;
                    }
                    option.source.code[p._packetInfo.packet] = p._packetInfo.path;
                }
                for (var i in option.source) {
                    var n = p._packetInfo[i];
                    for (var t in n) {
                        option.source[i][n[t].packet] = n[t].path;
                    }
                }
                thss.next();
            });
        }, null, files[i]);
    }
    queue.run();
    return ps;
};
module.exports = packetMaker;
