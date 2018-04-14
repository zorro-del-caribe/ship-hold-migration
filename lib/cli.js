#!/usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _shipHold = require('ship-hold');

var _shipHold2 = _interopRequireDefault(_shipHold);

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_commander2.default.command('up').description('execute all pending migrations').option('--dbconf <conf>', 'the path to the database configuration file').option('--mdir <mdir> ', 'use a different migrations folder').version('1.0.0').action(({ dbconf = './config/db', mdir = './migrations' } = { dbconf: './config/db', directory: './migrations' }) => {
	const dbConf = require(_path2.default.join(process.cwd(), dbconf));
	const sh = (0, _shipHold2.default)(dbConf);
	(0, _index2.default)(sh, { directory: mdir });

	return sh.migrator().up().then(function (results) {
		console.log(`successfully migrated ${results.length} migration(s)`);
		sh.stop();
	}).catch(e => {
		console.log(e);
		process.exit(1);
	});
});

_commander2.default.command('down').description('rollback the latest migration').option('--dbconf <conf>', 'the path to the database configuration file').option('--mdir <mdir> ', 'use a different migrations folder').version('1.0.0').action(({ dbconf = './config/db', mdir = './migrations' } = { dbconf: './config/db', directory: './migrations' }) => {

	const dbConf = require(_path2.default.join(process.cwd(), dbconf));

	const sh = (0, _shipHold2.default)(dbConf);

	(0, _index2.default)(sh, { directory: mdir });

	return sh.migrator().down().then(result => {
		console.log(`successfully rolled back ${result.name} migration`);
		sh.stop();
	}).catch(e => {
		console.log(e);
		process.exit(1);
	});
});

_commander2.default.command('ls').description('return the list of all migrations').option('--dbconf <conf>', 'the path to the database configuration file').option('--mdir <mdir>', 'use a different migrations folder').option('-e, --executed', 'return only the executed migrations').option('-p, --pending', 'return only the pending migrations').version('1.0.0').action(({ dbconf = './config/db', executed, pending, mdir = './migrations' } = {
	dbconf: './config/db',
	directory: './migrations'
}) => {
	const dbConf = require(_path2.default.join(process.cwd(), dbconf));
	const method = executed ? 'executed' : pending ? 'pending' : 'list';
	const sh = (0, _shipHold2.default)(dbConf);

	(0, _index2.default)(sh, { directory: mdir });

	const migrator = sh.migrator();
	return Promise.resolve(migrator[method]()).then(function (results) {
		console.log(results);
		sh.stop();
	}).catch(e => {
		console.log(e);
		process.exit(1);
	});
});

_commander2.default.command('migration:create <name>').description('create a new migration').option('-d, --mdir <mdir>', 'specify the migration directory').version('1.0.0').action((name, options = {}) => {
	const now = Date.now();
	const dir = options.mdir || '/migrations';
	const fullPath = _path2.default.join(process.cwd(), dir, [name, 'js'].join('.'));
	const writeStream = _fs2.default.createWriteStream(fullPath);

	const code = `module.exports = {
  name: '${name}',
  timestamp: ${now},
  async up(sh) {
    throw new Error('Not implemented');
  },
  async down(sh) {
		throw new Error('Not implemented');
  }
};`;

	writeStream.write(code, function () {
		writeStream.close();
	});
});

_commander2.default.parse(process.argv);