import migrator from './lib/migrator';

export default (sh, opts = {}) => {
	sh.migrator = () => migrator(Object.assign({}, opts, {sh}));
	return sh;
};