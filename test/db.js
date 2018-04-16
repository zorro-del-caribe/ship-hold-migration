module.exports = {
	user: process.env.POSTGRES_USER || 'docker',
	password: process.env.POSTGRES_PASSWORD || 'docker',
	database: process.env.POSTGRES_DB || 'ship-hold-migrations-test'
};