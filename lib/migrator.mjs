import fs from 'fs';
import path from 'path';
import debugFactory from 'debug';

const debug = debugFactory('ship-hold-migration');

const findOrCreateModel = async ({modelName, tableName, sh}) => {
	const models = [...sh];
	const model = models.find(([name, model]) => name === modelName);

	if (model) {
		return model[1];
	}

	await sh.query(`CREATE TABLE IF NOT EXISTS ${tableName}
	(
		id serial PRIMARY KEY,
		name varchar(128),
		created_at timestamp DEFAULT current_timestamp
	);`);

	return sh.model(modelName, def => ({
		table: tableName,
		columns: {
			id: 'integer',
			name: 'string',
			created_at: 'timestamp'
		},
		relations: {}
	}));
};

export default ({directory = '/migrations', modelName = 'migrations', tableName = 'ship_hold_migrations', sh} = {
	directory: '/migrations',
	modelName: 'migrations',
	tableName: 'ship_hold_migrations'
}) => {

	const model = () => findOrCreateModel({modelName, tableName, sh});

	const migrations = () => {
		const fullPath = path.join(process.cwd(), directory);
		const migrationsFileNames = fs.readdirSync(fullPath)
			.map(file => file.split('.')[0]);

		return migrationsFileNames
			.map(mfn => {
				const migration = require(path.join(fullPath, mfn));
				migration.name = migration.name || mfn;
				return migration;
			})
			.sort((a, b) => a.timestamp > b.timestamp ? 1 : (a.timestamp === b.timestamp ? 0 : -1));
	};

	const list = () => migrations().map(m => m.name);

	const pending = async () => {
		const modelInstance = await model();
		const migrationList = await modelInstance
			.select('name')
			.orderBy('created_at', 'asc')
			.run();

		return list()
			.filter(m => migrationList.every(n => n.name !== m));
	};

	const executed = async () => {
		const modelInstance = await model();
		const migrationList = await modelInstance
			.select('name')
			.orderBy('created_at', 'asc')
			.run();
		return migrationList.map(m => m.name);
	};

	const up = async () => {
		const list = migrations();
		const pendingMigrations = (await pending())
			.map(p => list.find(l => l.name === p));
		const modelInstance = await model();

		const success = [];
		for (const migration of pendingMigrations) {
			debug(`starting migration ${migration.name}`);
			try {
				await migration.up(sh);
				const [successful] = await modelInstance
					.insert({name: migration.name})
					.run();
				success.push(successful);
				debug(`successfully processed migration ${migration.name}`);
			} catch (e) {
				debug('failed at processing migration: ' + migration.name);
				debug('ending migrations');
				throw e;
			}
		}
		return success;
	};

	const down = async () => {
		const modelInstance = await model();
		const [last] = await modelInstance
			.select()
			.orderBy('created_at', 'desc')
			.limit(1)
			.run();

		const migrationList = migrations();
		const migration = migrationList.filter(l => l.name === last.name)[0];

		if (!migration) {
			throw new Error(`source file for ${migration.name} is missing !`);
		}

		debug(`rolling back last migration ${migration.name}`);
		try {
			await migration.down(sh);
			await modelInstance
				.delete()
				.where('id', last.id)
				.run();
		} catch (e) {
			debug(`failed at rolling back migration: ${last.name}`);
			debug('ending migrations');
			throw e;
		}

		debug(`successfully rolled back migration: ${last.name}`);

		return migration;
	};

	return {
		model,
		list,
		pending,
		executed,
		up,
		down
	};
};
