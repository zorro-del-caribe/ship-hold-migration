const fs = require('fs');
const path = require('path');
const debug = require('debug')('ship-hold-migration');
const co = require('co');

function findOrCreateModel ({modelName, tableName, sh}) {
  const models = sh.models();
  if (models.indexOf(modelName) !== -1) {
    return Promise.resolve(sh.model(modelName))
  } else {
    return sh.getConnection()
      .then(function ({client, done}) {
        return new Promise(function (resolve, reject) {
          client.query(`
        CREATE TABLE IF NOT EXISTS ${tableName}
        (
        id serial PRIMARY KEY,
        name varchar(128),
        "createdAt" timestamp DEFAULT current_timestamp
        );
        `, function (err, result) {
            if (err) {
              return reject(err);
            }
            else {
              sh.model(modelName, function (h) {
                return {
                  table: tableName,
                  columns: {
                    id: 'integer',
                    name: 'string',
                    createdAt: 'timestamp',
                  }
                };
              });
              done();
              resolve(sh.model(modelName));
            }
          });
        });
      });
  }
}

const proto = {
  model(){
    return findOrCreateModel(this);
  },
  up(){
    return this.pending()
      .then(pending => {
        const lists = this.migrations();
        return pending.map(p => lists.find(l=>l.name === p));
      })
      .then(pendingMigrations => {
        const self = this;
        const asyncIter = co.wrap(function * (migrations) {
          const model = yield self.model();
          const success = [];
          for (const m of migrations) {
            debug('starting migration: ' + m.name);
            try {
              yield m.up();
              const [successful] = yield model
                .insert({name: m.name})
                .run();
              success.push(successful);
            } catch (e) {
              debug('failed at processing migration: ' + m.name);
              debug('ending migrations');
              throw e;
            }
            debug('successfully processed migration ' + m.name);
          }
          return success;
        });
        return asyncIter(pendingMigrations);
      });
  },
  down(){
    return this.model()
      .then(model => {
        return model
          .select()
          .orderBy('createdAt', 'desc')
          .limit(1)
          .run()
          .then(toDown => {
            const list = this.migrations();
            const asyncIter = co.wrap(function * (migrations) {
              const success = [];
              for (const m of migrations) {
                try {
                  const mig = list.find(l=>l.name === m.name);
                  if (!mig) {
                    throw new Error(`source file for ${m.name} is missing !`);
                  }
                  debug('rolling back migration: ' + m.name);
                  yield mig.down();
                  yield model
                    .delete()
                    .where('id', '$id')
                    .run({id: m.id});
                  debug('successfully rolled back migration: ' + m.name);
                  success.push(m);
                } catch (e) {
                  debug('failed at rolling back migration: ' + m.name);
                  debug('ending migrations');
                  throw e;
                }
              }
              return success;
            });
            return asyncIter(toDown);
          });
      });
  },
  list(){
    return this.migrations()
      .map(m=>m.name);
  },
  pending(){
    return this.model()
      .then(model => {
        return model
          .select('name')
          .orderBy('createdAt', 'asc')
          .run();
      })
      .then(names => {
        const list = this.list();
        return list.filter(m => names.every(n=>n.name !== m));
      });
  },
  executed(){
    return this.model()
      .then((model) => {
        return model
          .select('name')
          .orderBy('createdAt', 'asc')
          .run();
      })
      .then(function (results) {
        return results.map(r=>r.name);
      });
  },
  migrations(){
    const fullPath = path.join(process.cwd(), this.directory);
    const migrationsFileNames = fs.readdirSync(fullPath)
      .map(file=>file.split('.')[0]);

    return migrationsFileNames
      .map(mfn=> {
        const migration = require(path.join(fullPath, mfn));
        migration.name = migration.name || mfn;
        return migration;
      })
      .sort(function (a, b) {
        return a.timestamp > b.timestamp ? 1 : -1;
      });

  }
};

module.exports = function factory ({modelName = 'migrations', tableName = 'shiphold_migrations', directory = '/migrations', shiphold}) {
  return Object.create(proto, {
    sh: {value: shiphold},
    directory: {value: directory},
    modelName: {value: modelName},
    tableName: {value: tableName}
  });
};