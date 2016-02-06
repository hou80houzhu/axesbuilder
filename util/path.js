var path = function (path,isfolder) {
    if(isfolder===undefined){
        isfolder=true;
    }
    if(isfolder){
        path = path.replace(/\\/g, "/");
        if (path[path.length - 1] !== "/") {
            path = path + "/";
        }
    }
    this.path = path;
    this.isfolder=isfolder;
};
path.prototype.parent = function () {
    var a = this.path.split("/");
    a.splice(a.length - 2, 2);
    return new path(a.join("/") + "/");
};
path.prototype.getPath = function () {
    return this.path;
};
path.prototype.toString = function () {
    return this.path;
};
path.prototype.suffix = function () {
    var n = this.path.split("."), suffix = "";
    if (n.length > 1) {
        suffix = n[n.length - 1] || "";
    }
    return suffix;
};
path.prototype.suffixWith = function (suffix) {
    return this.suffix() === suffix;
};
path.prototype.getRelativePathInfo = function (path) {
    var base = this.path;
    var r = "", suffix = "", c = path.split("/"), folder = false;
    var n = c[c.length - 1].match(/\*\.[a-zA-Z*]+/);
    if (n) {
        c.splice(c.length - 1, 1);
        path = c.join("/") + "/";
        suffix = n[0].substring(2);
        folder = true;
    }
    if (path[0] === "." && path[1] === "/") {
        r = base + path.substring(2);
    } else {
        var a = path.match(/\.\.\//g), b = base.split("/");
        if (a) {
            b.splice(b.length - a.length - 1, a.length + 1);
            path = path.substring(a.length * 3);
            if (b.length > 0) {
                r = b.join("/") + "/" + path;
            } else {
                r = path;
            }
        } else {
            if (path[0] === "/") {
                r = base + path;
            } else {
                r = base + "/" + path;
            }
        }
    }
    return {
        path: r,
        suffix: suffix,
        folder: folder
    };
};
module.exports = function (p,isfolder) {
    return new path(p,isfolder);
};