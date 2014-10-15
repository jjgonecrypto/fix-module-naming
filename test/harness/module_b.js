'use strict';

require('./module_a');
var ModuleD = require('./pk2/moduleD');

var Backbone = { Model: { extends: function () {} } };

module.exports = Bacbone.Model.extends({});
