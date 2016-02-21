var fs = require("fs");
var packet = require("./axes");
var file = function (path) {
    this.path = path;
};
file.prototype.read = function (option) {
    var ops = {
        encoding: "utf8",
        flag: 'r'
    };
    packet.extend(ops, option);
    var ps = packet.promise();
    fs.readFile(this.path, ops, function (err, data) {
        if (err) {
            ps.reject(err);
        }else{
            ps.resolve(data);
        }
    });
    return ps;
};
file.prototype.scan = function (fn) {
    var path = this.path;
    var fileList = [], folderList = [];
    var walk = function (path, fileList, folderList) {
        files = fs.readdirSync(path);
        files.forEach(function (item) {
            var tmpPath = path + '/' + item, stats = fs.statSync(tmpPath);
            if (stats.isDirectory()) {
                walk(tmpPath, fileList, folderList);
                folderList.push(tmpPath);
                fn && fn(tmpPath, false);
            } else {
                fileList.push(tmpPath);
                fn && fn(tmpPath, true);
            }
        });
    };
    walk(path, fileList, folderList);
};
file.prototype.write = function (content) {
    var ps = packet.promise();
    var dirpath = this.path;
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
            fs.writeFile(dirpath, content);
            ps.resolve();
        });
    } else {
        fs.writeFile(dirpath, content);
        ps.resolve();
    }
    return ps;
};
file.prototype.getAllSubFilesPath = function () {
    var ps = packet.promise();
    var path = this.path;
    var fileList = [];
    var walk = function (path, fileList) {
        files = fs.readdirSync(path);
        files.forEach(function (item) {
            var tmpPath = path + item, stats = fs.statSync(tmpPath);
            if (stats.isDirectory()) {
                walk(tmpPath+"/", fileList);
            } else {
                fileList.push(tmpPath);
            }
        });
    };
    walk(path, fileList);
    ps.resolve(fileList);
    return ps;
};
file.prototype.getSubFilesPath = function () {
    var tmpPath = this.path, ps = packet.promise(), r = [];
    var stats = fs.statSync(tmpPath);
    if (stats.isDirectory()) {
        files = fs.readdirSync(path);
        files.forEach(function (item) {
            var tmpPath = path + '/' + item, stats = fs.statSync(tmpPath);
            if (!stats.isDirectory()) {
                r.push(tmpPath);
            }
        });
        ps.resolve(r);
    } else {
        ps.resolve([]);
    }
    return ps;
};
file.prototype.getSubFilesPathWithSuffix = function (suffix) {
    var tmpPath = this.path, ps = packet.promise(), r = [];
    var stats = fs.statSync(tmpPath);
    if (stats.isDirectory()) {
        files = fs.readdirSync(tmpPath);
        files.forEach(function (item) {
            var p = tmpPath + item;
            var stats = fs.statSync(p);
            if (!stats.isDirectory()) {
                if (suffix === "*") {
                    r.push(p);
                } else if (p.substring(p.length - suffix.length) === suffix) {
                    r.push(p);
                }
            }
        });
        ps.resolve(r);
    } else {
        ps.resolve(r);
    }
    return ps;
};
module.exports = function (path) {
    return new file(path);
};