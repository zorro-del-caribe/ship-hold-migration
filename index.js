const migrator = require('./lib/migrator');
const path = require('path');
const fs = require('fs');

module.exports = function (sh, options = {}) {
  sh.migrator = function () {
    return migrator(Object.assign({}, options, {shiphold: sh}));
  };
  return sh;
};