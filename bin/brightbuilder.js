#!/usr/bin/env node  
var version = "0.0.7";
var commander = function () {
    this._commands = {};
};
commander.blank = function (t) {
    var m = "";
    for (var i = 0; i < t; i++) {
        m += " ";
    }
    return m;
};
commander.prototype.bind = function (command, desc, paras, fn) {
    this._commands[command] = {
        name: command,
        desc: desc,
        fn: fn,
        paras: paras
    };
    return this;
};
commander.prototype.call = function (parameter) {
    var command = parameter[0];
    parameter.splice(0, 1);
    if (this._commands[command]) {
        this._commands[command].fn.apply(this, parameter);
    } else {
        this.showDesc();
    }
};
commander.prototype.showDesc = function () {
    console.log("Useage:");
    var leg = 0;
    for (var i in this._commands) {
        var info = this._commands[i];
        if (info.name.length > leg) {
            leg = info.name.length;
        }
    }
    leg = leg + 6;
    for (var i in this._commands) {
        var info = this._commands[i], t = [];
        if (info.paras) {
            console.log("   " + info.name + (info.paras ? ":" + info.paras : ""));
            console.log("   " + commander.blank(leg) + info.desc);
        } else {
            console.log("   " + info.name + commander.blank(leg - info.name.length) + info.desc);
        }
    }
};

new commander().bind("v", "show version", null, function () {
    console.log('version is ' + version);
}).bind("build", "build prjects", "<src path>", function (path) {
    require("../builder").build(path);
}).bind("help", "show help", null, function () {
    this.showDesc();
}).bind("h", "show help", null, function () {
    this.showDesc();
}).call(process.argv.slice(2));