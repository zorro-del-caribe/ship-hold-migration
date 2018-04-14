'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _migrator = require('./lib/migrator');

var _migrator2 = _interopRequireDefault(_migrator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (sh, opts = {}) => {
	sh.migrator = () => (0, _migrator2.default)(Object.assign({}, opts, { sh }));
	return sh;
};