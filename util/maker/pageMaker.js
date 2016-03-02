var bright = require("../bright");
var file = require("../file");
var pageMaker = function (option) {
    console.log("[brightbuilder] start change pages...");
    var files = option.changePages;
    var queue = bright.queue();
    var ps = bright.promise();
    queue.complete(function () {
        console.log("[brightbuilder] change pages end");
        ps.resolve();
    });
    for (var i in files) {
        queue.add(function (a, b) {
            var thss = this;
            file(b).read().done(function (data) {
                var editable = false;
                if (data) {
                    if (option.updatePageType === "1" || option.updatePageType === "2") {
                        data = data.replace(/\$\.App\(\{[\w\W]*?\}\)/g, function (a) {
                            var q = a.substring(6, a.length - 1);
                            var m = new Function("return " + q + ";")();
                            if (!m || m === "") {
                                m = {};
                            }
                            m.basePath = option.pathPrefix + option.build + "/";
                            m.id=option.id;
                            m.update=parseInt(option.build.match(/[0-9]+/)[0])-2;
                            m.debug = false;
                            m.sourceMapping = option.sourceMapping;
                            editable = true;
                            return "$.App(" + JSON.stringify(m) + ")";
                        }).replace(/\packet\.App\(\{[\w\W]*?\}\)/g, function (a) {
                            var q = a.substring(6, a.length - 1);
                            var m = new Function("return " + q + ";")();
                            if (!m || m === "") {
                                m = {};
                            }
                            m.basePath = option.pathPrefix + option.build + "/";
                            m.id=option.id;
                            m.debug = false;
                            m.sourceMapping = option.sourceMapping;
                            editable = true;
                            return "packet.App(" + JSON.stringify(m) + ")";
                        });
                    }
                    var t = b;
                    if (option.updatePageType === "2") {
                        t = b.split("/");
                        t[t.length - 1] = option.build + "-" + t[t.length - 1];
                        t = t.join("/");
                    }
                    file(t).write(data);
                }
                console.log("[brightbuilder] change page path of " + b + (editable ? " [updated]" : " [no updated]"));
                thss.next();
            }).fail(function () {
                console.log("[brightbuilder] change page path of " + b + " [fail]");
                thss.next();
            });
        }, null, files[i]);
    }
    queue.run();
    return ps;
};
module.exports = pageMaker;