'use strict';

var path = require('path');
var fs = require('fs');
var _s = require('underscore.string');
var esprima = require('esprima');
var esquery = require('esquery');
require('colors');

function walk(dir, predicate) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) results = results.concat(walk(file, predicate));
        else if (predicate(file)) results.push(file);
    });
    return results;
}

//get all .js files recursively from current executing directory
function getJSFiles() {
    return walk(process.cwd(), function (file) {
        return !file.match(/thirdparty/) && file.slice(-3).toLowerCase() === '.js';
    });
}

function ast(file) {
    var script = fs.readFileSync(file, 'utf-8');
    return esprima.parse(script);
}
module.exports = function () {

    var map = {};

    getJSFiles().forEach(function (file) {
        //camelCase from underscore
        var newName = _s.camelize(path.basename(file));

        //capitalize if has module.exports
        //get all module.exports = function declaration or function call
        var settingModuleExports = esquery(ast(file),
            'AssignmentExpression[left.object.name="module"][left.property.name="exports"][right.type=/(CallExpression|FunctionExpression)/]');
        if (settingModuleExports.length > 0) newName = _s.capitalize(newName);

        map[file] = newName;

        //TODO rename
        //fs.renameSync(file, path.join(path.dirname(file), newName));
        console.log('Renaming: '.green + path.join(path.dirname(file), newName));
    });

    //get files now renamed
    getJSFiles().forEach(function (file) {

        var requires = esquery(ast(file), 'CallExpression[callee.name="require"][arguments.0.value=/^\\./][arguments.0.value!=/\\.hbs$/]');

        requires.forEach(function (requireNode) {
            var relPath = requireNode.arguments[0].value;
            var relDir = path.dirname(relPath);
            var oldName = path.basename(relPath);
            var absPath = path.join(path.dirname(file), relDir, oldName);

            var newName = map[absPath + '.js'];

            if (typeof newName === 'undefined') {
                return console.log('Cannot find module: ' + absPath.red + ' in ' + file.yellow);
            }

            if (newName !== path.basename(relPath) + '.js') {
                var newRequire = path.join(relDir, newName).replace(/\.js$/, '');
                if (!newRequire.match(/^\./)) newRequire = '.' + path.sep + newRequire;
                console.log('Updating require: '.yellow + ' in ' + file + ' from ' + relPath + ' to ' + newRequire);
                // TODO update
            }
        });
    });
};
