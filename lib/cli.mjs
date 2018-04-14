#!/usr/bin/env node
import program from 'commander';
import path from 'path';
import shiphold from 'ship-hold';
import mig from '../index';
import fs from 'fs';

program
	.command('up')
	.description('execute all pending migrations')
	.option('--dbconf <conf>', 'the path to the database configuration file')
	.option('--mdir <mdir> ', 'use a different migrations folder')
	.version('1.0.0')
	.action(({dbconf = './config/db', mdir = './migrations'} = {dbconf: './config/db', directory: './migrations'}) => {
		const dbConf = require(path.join(process.cwd(), dbconf));
		const sh = shiphold(dbConf);
		mig(sh, {directory: mdir});

		return sh.migrator()
			.up()
			.then(function (results) {
				console.log(`successfully migrated ${results.length} migration(s)`);
				sh.stop();
			})
			.catch(e => {
				console.log(e);
				process.exit(1);
			});
	});

program
	.command('down')
	.description('rollback the latest migration')
	.option('--dbconf <conf>', 'the path to the database configuration file')
	.option('--mdir <mdir> ', 'use a different migrations folder')
	.version('1.0.0')
	.action(({dbconf = './config/db', mdir = './migrations'} = {dbconf: './config/db', directory: './migrations'}) => {

		const dbConf = require(path.join(process.cwd(), dbconf));

		const sh = shiphold(dbConf);

		mig(sh, {directory: mdir});

		return sh.migrator()
			.down()
			.then( result => {
				console.log(`successfully rolled back ${result.name} migration`);
				sh.stop();
			})
			.catch(e => {
				console.log(e);
				process.exit(1);
			});
	});

program
	.command('ls')
	.description('return the list of all migrations')
	.option('--dbconf <conf>', 'the path to the database configuration file')
	.option('--mdir <mdir>', 'use a different migrations folder')
	.option('-e, --executed', 'return only the executed migrations')
	.option('-p, --pending', 'return only the pending migrations')
	.version('1.0.0')
	.action(({dbconf = './config/db', executed, pending, mdir = './migrations'} = {
		dbconf: './config/db',
		directory: './migrations'
	}) => {
		const dbConf = require(path.join(process.cwd(), dbconf));
		const method = executed ? 'executed' : (pending ? 'pending' : 'list');
		const sh = shiphold(dbConf);

		mig(sh, {directory: mdir});

		const migrator = sh.migrator();
		return Promise.resolve(migrator[method]())
			.then(function (results) {
				console.log(results);
				sh.stop();
			})
			.catch(e => {
				console.log(e);
				process.exit(1);
			});
	});

program
	.command('migration:create <name>')
	.description('create a new migration')
	.option('-d, --mdir <mdir>', 'specify the migration directory')
	.version('1.0.0')
	.action((name, options = {}) => {
		const now = Date.now();
		const dir = options.mdir || '/migrations';
		const fullPath = path.join(process.cwd(), dir, [name, 'js'].join('.'));
		const writeStream = fs.createWriteStream(fullPath);

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


program.parse(process.argv);