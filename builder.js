var file = require("./util/file");
var pather = require("./util/path");
var bright = require("./util/bright");
var packetMaker = require("./util/maker/packetMaker");
var cssMaker = require("./util/maker/cssMaker");
var templateMaker = require("./util/maker/templateMaker");
var htmlMaker = require("./util/maker/htmlMaker");
var textMaker = require("./util/maker/textMaker");
var jsonMaker = require("./util/maker/jsonMaker");
var imageMaker = require("./util/maker/imageMaker");
var jsMaker = require("./util/maker/jsMaker");
var otherMaker = require("./util/maker/otherMaker");
var pageMaker = require("./util/maker/pageMaker");

var getConfigInfo = function (path, fn) {
    path = path.replace(/\\/g, "/");
    if (path[path.length - 1] !== "/") {
        path = path + "/";
    }
    var configPath = path + "build.json";
    file(configPath).read().done(function (data) {
        var info = JSON.parse(data);
        var ops = {
            id:"id",
            build: 0,
            pathPrefix: "",
            updatePage: {type: 1, backup: true, path: []}, //type=0:do nothing,type=1:edit,type=2:add file
            cssCompressWithout: [],
            codeCompressWithout: [],
            tmpCompressWithout: []
        };
        for (var i in info) {
            ops[i] = info[i];
        }
        ops.id=ops.id.toUpperCase();
        if (!ops.updatePage) {
            ops.updatePage = {type: 1, backup: true, path: []};
        }
        buildCode(configPath, ops).done(function (code) {
            ops.build = ops.id+code;
            ops.basePath = path;
            ops.packet = ops.pathPrefix + ops.build + "/";
            ops.newPath = pather(path).parent().getPath() + ops.build + "/";
            ops.changePages = [];
            ops.codeCompress = "";
            ops.templateCompress = "";
            ops.cssCompress = "";
            ops.updatePageType = ops.updatePage ? (ops.updatePage.type || 0) + "" : "0";
            if (ops.updatePageType === "0") {
                ops.pages = [];
            } else {
                ops.pages = ops.updatePage.path;
            }
            ops.sourceMapping = {code: {}, template: {}, json: {}, html: {}, text: {}, other: {}, image: {}, css: {}, js: {}, source: ops.packet + "source.js", build: ops.build};
            ops.source = {css: {}, js: {}, json: {}, template: {}, html: {}, text: {}, image: {}, code: {}, other: {}};
            var num = ops.pages.length;
            for (var i in ops.pages) {
                num--;
                var m = pather(path).getRelativePathInfo(ops.pages[i]);
                if (!m.folder) {
                    if (ops.changePages.indexOf(m.path) === -1) {
                        ops.changePages.push(m.path);
                    }
                } else {
                    num++;
                    file(m.path).getSubFilesPathWithSuffix(m.suffix).done(function (a) {
                        for (var i in a) {
                            if (ops.changePages.indexOf(a[i]) === -1) {
                                ops.changePages.push(a[i]);
                            }
                        }
                        num--;
                        if (num === 0) {
                            fn && fn(ops);
                        }
                    });
                }
            }
            if (num === 0) {
                fn && fn(ops);
            }
        });
    }).fail(function () {
        console.log("build.json can not find");
    });
};
var buildCode = function (configPath, info) {
    var build = parseInt(info.build) + 1, ps = bright.promise();
    if ((build + "").length < 6) {
        var t = "";
        for (var i = 0; i < 6 - (build + "").length; i++) {
            t += "0";
        }
        t += build;
        build = t;
    }
    info.build = build;
    file(configPath).write(JSON.stringify(info, null, 3)).done(function () {
        ps.resolve(build);
    });
    return ps;
};
var run = function (option) {
    file(option.basePath).getAllSubFilesPath().done(function (files) {
        var mapping = {
            js: [],
            css: [],
            json: [],
            image: [],
            text: [],
            html: [],
            other: []
        };
        for (var i = 0; i < files.length; i++) {
            var pa = pather(files[i], false);
            if (pa.suffixWith("js")) {
                mapping.js.push(files[i]);
            } else if (pa.suffixWith("css")) {
                mapping.css.push(files[i]);
            } else if (".bmp.jpg.tiff.gif.pcx.tga.exif.fpx.svg.psd.cdr.pcd.dxf.ufo.eps.ai.raw".indexOf(pa.suffix()) !== -1) {
                mapping.image.push(files[i]);
            } else if (pa.suffixWith("txt")) {
                mapping.text.push(files[i]);
            } else if (pa.suffixWith("html")) {
                mapping.html.push(files[i]);
            } else if (pa.suffixWith("json")) {
                mapping.json.push(files[i]);
            } else {
                mapping.other.push(files[i]);
            }
        }
        option.mapping = mapping;
        packetMaker(option).done(function () {
            var queue = bright.queue();
            queue.complete(function () {
                file(option.newPath + "source.js").write("bright.source(" + JSON.stringify({
                    code: option.codeCompress,
                    template: option.templateCompress,
                    css: option.cssCompress
                }) + ");");
                file(option.newPath + "sourceMapping.min.json").write(JSON.stringify(option.sourceMapping));
                file(option.newPath + "sourceMapping.json").write(JSON.stringify(option.sourceMapping, null, 3));
                file(option.newPath + "result.json").write(JSON.stringify(option, null, 3));
                console.log("build end");
            });
            queue.add(function () {
                var ths = this;
                templateMaker(option).done(function () {
                    ths.next();
                });
            });
            queue.add(function () {
                var ths = this;
                cssMaker(option, true).done(function () {
                    ths.next();
                });
            });
            queue.add(function () {
                var ths = this;
                cssMaker(option, false).done(function () {
                    ths.next();
                });
            });
            queue.add(function () {
                var ths = this;
                jsonMaker(option).done(function () {
                    ths.next();
                });
            });
            queue.add(function () {
                var ths = this;
                textMaker(option).done(function () {
                    ths.next();
                });
            });
            queue.add(function () {
                var ths = this;
                imageMaker(option).done(function () {
                    ths.next();
                });
            });
            queue.add(function () {
                var ths = this;
                htmlMaker(option).done(function () {
                    ths.next();
                });
            });
            queue.add(function () {
                var ths = this;
                jsMaker(option).done(function () {
                    ths.next();
                });
            });
            queue.add(function () {
                var ths = this;
                otherMaker(option).done(function () {
                    ths.next();
                });
            });
            queue.add(function () {
                var ths = this;
                pageMaker(option).done(function () {
                    ths.next();
                });
            });
            queue.run();
        });
    });
};

module.exports = {
    build: function (pa) {
        getConfigInfo(pa, function (ops) {
            run(ops);
        });
    }
};