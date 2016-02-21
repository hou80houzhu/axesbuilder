#!/usr/bin/env node  
var run = function (obj) {
    if (obj[0] === 'version') {
        console.log('version is 0.0.4');
    } else if (obj[0] === 'help') {
        console.log('Useage:');
        console.log('  version --version [show version]');
        console.log('  build --build [to build project]');
    } else if (obj[0] === "build") {
        require("../builder").build(obj[1]);
    } else {
        console.log('Useage:');
        console.log('  version --version [show version]');
        console.log('  build --build [to build project]');
    }
};
run(process.argv.slice(2));