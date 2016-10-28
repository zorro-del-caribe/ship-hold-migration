#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const shiphold = require('ship-hold');
const mig = require('../index');
const fs = require('fs');

program
  .command('up')
  .description('execute all pending migrations')
  .option('--dbconf <conf>', 'the path to the database configuration file')
  .option('--mdir <mdir> ', 'use a different migrations folder')
  .version('1.0.0')
  .action(function (options = {}) {


    // if (options.verbose) {
    //   process.env.DEBUG = 'ship-hold-migration';
    // }

    const confFile = options.dbconf || './config/db';
    const directory = options.mdir || './migrations';
    const dbConf = require(path.join(process.cwd(), confFile));

    const sh = shiphold(dbConf);

    mig(sh, {directory});

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
  .action(function (options = {}) {


    // if (options.verbose) {
    //   process.env.DEBUG = 'ship-hold-migration';
    // }

    const confFile = options.dbconf || './config/db';
    const directory = options.mdir || './migrations';
    const dbConf = require(path.join(process.cwd(), confFile));

    const sh = shiphold(dbConf);

    mig(sh, {directory});

    return sh.migrator()
      .down()
      .then(function (results) {
        console.log(`successfully rolled back ${results.length} migration(s)`);
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
  .option('--mdir <mdir> ', 'use a different migrations folder')
  .option('-e, --executed', 'return only the executed migrations')
  .option('-p, --pending', 'return only the pending migrations')
  .version('1.0.0')
  .action(function (options = {}) {


    // if (options.verbose) {
    //   process.env.DEBUG = 'ship-hold-migration';
    // }

    const confFile = options.dbconf || './config/db';
    const directory = options.mdir || './migrations';
    const dbConf = require(path.join(process.cwd(), confFile));
    let method = 'list';
    if (options.executed) {
      method = 'executed'
    } else if (options.pending) {
      method = 'pending';
    }

    const sh = shiphold(dbConf);

    mig(sh, {directory});

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
  .option('-d, --mdir <dir>','specify the migration directory')
  .version('1.0.0')
  .action(function (name, options={}) {
    const now = Date.now();
    const dir = options.mdir || '/migrations';
    const fullPath = path.join(process.cwd(),dir,[name,'js'].join('.'));
    const writeStream = fs.createWriteStream(fullPath);

    const code = `module.exports = {
  name: '${name}',
  timestamp: ${now},
  up: function (sh) {
    return Promise.resolve();
  },
  down: function (sh) {
    return Promise.resolve();
  }
};`;

    writeStream.write(code, function () {
      writeStream.close();
    });
  });


program.parse(process.argv);

