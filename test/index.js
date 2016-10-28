const test = require('tape');
const mig = require('../index');
const shiphold = require('ship-hold');
const conf = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

function clean (sh, modelName = 'migrations') {
  return sh
    .model(modelName)
    .delete()
    .run();
}

test('read all migrations', t=> {
  const sh = shiphold(conf);
  mig(sh, {
    directory: '/test/migrations'
  });

  const migrator = sh.migrator();

  const result = migrator
    .list();
  t.ok(result.indexOf('barIsIt') !== -1);
  t.ok(result.indexOf('foo') !== -1);
  t.end();
});

test('return pending migrations (all)', t=> {
  const sh = shiphold(conf);
  mig(sh, {
    directory: '/test/migrations'
  });

  sh.migrator()
    .pending()
    .then(function (result) {
      t.equal(result.length, 2);
      t.equal(result[0], 'foo');
      t.equal(result[1], 'barIsIt');
      return clean(sh, 'migrations');
    })
    .then(function () {
      sh.stop();
      t.end();
    })
    .catch(t.end);
});

test('return pending migrations (barIsIt)', t=> {
  const sh = shiphold(conf);
  mig(sh, {
    directory: '/test/migrations'
  });

  const migrator = sh.migrator();

  migrator.model()
    .then(model=> {
      return model
        .insert({name: 'foo'})
        .run();
    })
    .then(function () {
      return migrator.pending();
    })
    .then(function (result) {
      t.equal(result.length, 1);
      t.equal(result[0], 'barIsIt');
      return clean(sh, 'migrations');
    })
    .then(function () {
      sh.stop();
      t.end();
    })
    .catch(t.end);


});

test('run all pending migrations (all)', t=> {
  const sh = shiphold(conf);
  mig(sh, {
    directory: '/test/migrations'
  });

  const migrator = sh.migrator();

  migrator
    .pending()
    .then(function (result) {
      t.equal(result.length, 2);
      return migrator.up();
    })
    .then(function (result) {
      const resultNames = result.map(r=>r.name);
      t.deepEqual(resultNames, ['foo', 'barIsIt']);
      return migrator.pending();
    })
    .then(function (result) {
      t.equal(result.length, 0);
      return clean(sh, 'migrations');
    })
    .then(function () {
      sh.stop();
      t.end();
    })
    .catch(t.end);
});

test('run all pending migrations (barIsIt)', t=> {
  const sh = shiphold(conf);
  mig(sh, {
    directory: '/test/migrations'
  });

  const migrator = sh.migrator();

  migrator
    .model()
    .then(function (model) {
      return model
        .insert({name: 'foo'})
        .run();
    })
    .then(function () {
      return migrator.pending();
    })
    .then(function (result) {
      t.equal(result.length, 1);
      return migrator.up();
    })
    .then(function (result) {
      const resultNames = result.map(r=>r.name);
      t.deepEqual(resultNames, ['barIsIt']);
      return migrator.pending();
    })
    .then(function (result) {
      t.equal(result.length, 0);
      return clean(sh, 'migrations');
    })
    .then(function () {
      sh.stop();
      t.end();
    })
    .catch(t.end);
});

test('return executed migrations', t=> {
  const sh = shiphold(conf);
  mig(sh, {
    directory: '/test/migrations'
  });

  const migrator = sh.migrator();

  migrator.up()
    .then(function () {
      return migrator.executed();
    })
    .then(function (result) {
      t.deepEqual(result, ['foo', 'barIsIt']);
    })
    .then(function () {
      return clean(sh)
    })
    .then(function () {
      sh.stop();
      t.end();
    })
    .catch(t.end);
});

test('return executed migrations (foo)', t=> {
  const sh = shiphold(conf);
  mig(sh, {
    directory: '/test/migrations'
  });

  const migrator = sh.migrator();

  migrator.model()
    .then(model=> {
      return model.insert({name: 'foo'}).run();
    })
    .then(function () {
      return migrator.executed();
    })
    .then(function (result) {
      t.deepEqual(result, ['foo']);
      return clean(sh);
    })
    .then(function () {
      sh.stop();
      t.end();
    })
    .catch(t.end);
});

test('down the last migration',t=>{
  const sh = shiphold(conf);
  mig(sh, {
    directory: '/test/migrations'
  });

  const migrator = sh.migrator();

  migrator.up()
    .then(function (result) {
      const resultNames = result.map(r=>r.name);
      t.deepEqual(resultNames, ['foo', 'barIsIt']);
      return migrator.down();
    })
    .then(function (result) {
      t.equal(result.length,1);
      t.equal(result[0].name,'barIsIt');
      return migrator.pending();
    })
    .then(function (pendings) {
      t.deepEqual(pendings,['barIsIt']);
      return clean(sh, 'migrations');
    })
    .then(function () {
      sh.stop();
      t.end();
    })
    .catch(t.end);
});





