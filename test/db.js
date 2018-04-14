module.exports = {
	user: process.env.POSTGRES_DB || 'docker',
	password: process.env.POSTGRES_PASSWORD || 'docker',
	database: process.env.POSTGRES_USER || 'ship-hold-migrations-test'
};