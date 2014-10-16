'use strict';

var path = require('path');
var fs = require('fs');
var _s = require('underscore.string');
var esprima = require('esprima');
var esquery = require('esquery');
var exec = require('child_process').exec;
var async = require('async');
require('colors');

var fileOpts = { encoding: 'utf-8' };

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
function getJSFiles(inputPath, ignore) {
    return walk(inputPath, function (file) {
        var anyIgnores = ignore.reduce(function (memo, current) {
            return memo || file.match(current);
        }, false);
        return !anyIgnores && file.slice(-3).toLowerCase() === '.js';
    });
}

function ast(file) {
    var script = fs.readFileSync(file, fileOpts);
    return esprima.parse(script);
}

module.exports = function (inputPath, options) {
    options = options || {};
    var map = {};

    inputPath = path.resolve(process.cwd(), inputPath);

    getJSFiles(inputPath, options.ignore || []).forEach(function (file) {
        //camelCase from underscore
        var newName = _s.camelize(path.basename(file));

        //capitalize if has module.exports
        //get all module.exports = function declaration or function call
        var settingModuleExports = esquery(ast(file),
            'AssignmentExpression[left.object.name="module"][left.property.name="exports"][right.type=/(CallExpression|FunctionExpression|Identifier)/]');
        if (settingModuleExports.length > 0) newName = _s.capitalize(newName);

        map[file] = newName;
    });

    async.eachSeries(Object.keys(map), function (file, callback) {
        var newName = map[file];

        //perform rename
        console.log(
            (options.mock ? '[MOCK] ' : '') +
            'Renaming: '.green + path.join(path.dirname(file), newName)
        );

        if (newName === path.basename(file)) return callback(); //no rename required

        if (options.mock) return callback();

        if (options.git)
            exec('git mv -f ' + file + ' ' + path.join(path.dirname(file), newName), callback);
        else
            fs.rename(file, path.join(path.dirname(file), newName), callback);

    }, function (err) {
        if (err) throw err;

        //get files now renamed
        getJSFiles(inputPath, options.ignore || []).forEach(function (file) {

            var requires = esquery(ast(file), 'CallExpression[callee.name="require"][arguments.0.value=/^\\./][arguments.0.value!=/\\.hbs$/]');

            var fileContents = fs.readFileSync(file, fileOpts);

            requires.forEach(function (requireNode) {
                var relPath = requireNode.arguments[0].value;
                var relDir = path.dirname(relPath);
                var oldName = path.basename(relPath);
                var absPath = path.join(path.dirname(file), relDir, oldName);

                var newName = map[absPath + '.js'];

                if (typeof newName === 'undefined') {
                    return console.log('Cannot find module in cache: ' + absPath.red + ' in ' + file.yellow);
                }

                if (newName !== path.basename(relPath) + '.js') {
                    var newRequire = path.join(relDir, newName).replace(/\.js$/, '');
                    if (!newRequire.match(/^\./)) newRequire = '.' + path.sep + newRequire;
                    console.log(
                        (options.mock ? '[MOCK] ' : '') +
                        'Updating require: '.green +
                        'in ' +
                        (options.mock ? path.join(path.dirname(file), map[file]).yellow : file.yellow) +
                        ' from ' + relPath +
                        ' to ' + newRequire
                    );
                    fileContents = fileContents.replace(new RegExp('require\\(("|\')(' + relPath + ')("|\')\\)'), 'require($1' + newRequire + '$1)');
                }
            });

            if (!options.mock) fs.writeFileSync(file, fileContents, fileOpts);
        });
    });


};
