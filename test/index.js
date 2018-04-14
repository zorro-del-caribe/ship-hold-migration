const test = require('zora');
const mig = require('../index.js')['default'];
const shiphold = require('ship-hold')['default'];
const conf = require('./db.js');

const clean = (sh, modelName = 'migrations') => sh
	.model(modelName)
	.delete()
	.run();

test('read all migrations', t => {
	const sh = shiphold(conf);
	mig(sh, {
		directory: '/test/migrations'
	});

	const migrator = sh.migrator();

	const result = migrator
		.list();
	t.equal(result.length, 2, 'should have two migrations');
	t.ok(result.includes('barIsIt'), 'should list "barIsIt"');
	t.ok(result.includes('foo'), 'should list "foo"');
});

test('migrations ', async t => {

	await t.test('check setup', async t => {
		const sh = mig(shiphold(conf), {directory: './test/migrations'});
		await sh.migrator().model();
		await clean(sh);
		const result = await sh.query(`SELECT now()`);
		t.ok(result);
		await sh.stop();
	});

	await t.test('return pending migrations (all)', async t => {
		const sh = shiphold(conf);
		mig(sh, {
			directory: '/test/migrations'
		});

		const pendings = await sh.migrator().pending();
		t.equal(pendings.length, 2);
		t.equal(pendings[0], 'foo');
		t.equal(pendings[1], 'barIsIt');
		await clean(sh, 'migrations');
		await sh.stop();
	});

	await t.test('return pending migrations (barIsIt)', async t => {
		const sh = shiphold(conf);
		mig(sh, {
			directory: '/test/migrations'
		});

		const migrator = sh.migrator();
		const model = await migrator.model();

		await model
			.insert({name: 'foo'})
			.run();

		const pending = await migrator.pending();
		t.equal(pending.length, 1);
		t.equal(pending[0], 'barIsIt');

		await clean(sh, 'migrations');
		await sh.stop();
	});

	await t.test('run all pending migrations (all)', async t => {
		const sh = shiphold(conf);
		mig(sh, {
			directory: '/test/migrations'
		});

		const migrator = sh.migrator();

		const pending = await migrator.pending();
		t.equal(pending.length, 2);
		const successup = await migrator.up();
		const resultNames = successup.map(r => r.name);
		t.deepEqual(resultNames, ['foo', 'barIsIt']);
		const emptyPending = await migrator.pending();
		t.equal(emptyPending.length, 0);
		await clean(sh, 'migrations');
		await sh.stop();
	});

	await t.test('return executed migrations', async t => {
		const sh = shiphold(conf);
		mig(sh, {
			directory: '/test/migrations'
		});

		const migrator = sh.migrator();

		await migrator.up();
		const executed = await migrator.executed();
		t.deepEqual(executed, ['foo', 'barIsIt']);
		await clean(sh);
		await sh.stop();
	});

	await t.test('return executed migrations (foo)', async t => {
		const sh = shiphold(conf);
		mig(sh, {
			directory: '/test/migrations'
		});

		const migrator = sh.migrator();

		const model = await migrator.model();
		await model.insert({name: 'foo'}).run();
		const exectued = await migrator.executed();
		t.deepEqual(exectued, ['foo']);
		await clean(sh);
		await sh.stop();
	});

	await t.test('down the last migration', async t => {
		const sh = shiphold(conf);
		mig(sh, {
			directory: '/test/migrations'
		});

		const migrator = sh.migrator();

		const successUp = await migrator.up();
		const resultNames = successUp.map(r => r.name);
		t.deepEqual(resultNames, ['foo', 'barIsIt']);
		const successDown = await migrator.down();
		t.equal(successDown.name, 'barIsIt');
		const pendings = await migrator.pending();
		t.deepEqual(pendings, ['barIsIt']);
		await clean(sh, 'migrations');
		await sh.stop();
	});
});
