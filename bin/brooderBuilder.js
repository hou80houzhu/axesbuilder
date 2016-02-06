#!/usr/bin/env node  
var run = function (obj) {
    if (obj[0] === '-v') {
        console.log('version is 0.0.1');
    } else if (obj[0] === '-h') {
        console.log('Useage:');
        console.log('  -v --version [show version]');
        console.log('  -b --build [to build project]');
    } else if (obj[0] === "-b") {
        require("../builder").build(obj[1]);
    } else {
        console.log('Useage:');
        console.log('  -v --version [show version]');
        console.log('  -b --build [to build project]');
    }
};
run(process.argv.slice(2));