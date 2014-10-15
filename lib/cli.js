#!/usr/bin/env node

'use strict';

var fixer = require('./fixer');

fixer(process.argv.slice(2, 3));
