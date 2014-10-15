#!/usr/bin/env node

'use strict';

var fixer = require('./fixer');
var program = require('commander');

program
  .version('0.1.1')
  .option('-m, --mock', 'Mock mode, shows changes without making any')
  .option('-i, --ignore <items>', 'Ignore file pattern', function list(val) { return val.split(','); })
  .parse(process.argv);


fixer(program.args.length ? program.args[0] : '.', { mock: program.mock, ignore: program.ignore });
