'use strict';

var path = require('path');
var fixer = require('../lib/fixer');
var fs = require('fs-extra');
var expect = require('chai').expect;
var detect = require('detect-invalid-requires');

describe('fixer', function () {
    var dest = path.join(__dirname, 'copy');
    var src = path.join(__dirname, 'harness');

    beforeEach(function () {
        //make a copy of harness
        fs.copySync(src, dest);
    });

    it('must rename files', function (done) {
        fixer(dest, {}, function (err) {
            expect(err).to.be.undefined;
            var files = fs.readdirSync(dest);
            expect(files).to.include('moduleA.js');
            expect(files).to.include('ModuleB.js');
            expect(files).to.not.include('module_a.js');
            expect(files).to.not.include('module_b.js');
            files = fs.readdirSync(path.join(dest, 'pk1'));
            expect(files).to.include('moduleC.js');
            expect(files).to.not.include('module_c.js');
            files = fs.readdirSync(path.join(dest, 'pk2'));
            expect(files).to.include('ModuleD.js');
            expect(files).to.not.include('moduleD.js');
            done();
        });
    });

    function getContents(oldPath, newPath) {
        return {
            oldContents: fs.readFileSync(path.join(src, oldPath), { encoding: 'utf-8' }),
            newContents: fs.readFileSync(path.join(dest, newPath), { encoding: 'utf-8' }),
        };
    }

    it('must update module definitions', function (done) {
        fixer(dest, {}, function (err) {
            expect(err).to.be.undefined;

            var moduleA = getContents('module_a.js', 'moduleA.js');
            expect(moduleA.oldContents).to.equal(moduleA.newContents);

            var moduleB = getContents('module_b.js', 'ModuleB.js');
            expect(moduleB.newContents).to.equal(moduleB.oldContents.replace('./module_a', './moduleA').replace('./pk2/moduleD', './pk2/ModuleD'));

            var moduleC = getContents('pk1/module_c.js', 'pk1/ModuleC.js');
            expect(moduleC.newContents).to.equal(moduleC.oldContents.replace('../module_b', '../ModuleB'));

            var moduleD = getContents('pk2/moduleD.js', 'pk2/ModuleD.js');
            expect(moduleD.newContents).to.equal(moduleD.oldContents);

            //ensure all module requires are case-sensitive
            detect(dest, function (invalid) {
                expect(invalid).to.be.empty;
                done();
            });
        });
    });

    afterEach(function () {
        fs.removeSync(dest);
    });

});
