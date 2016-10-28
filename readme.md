# ship-hold-migration
[![CircleCI](https://circleci.com/gh/zorro-del-caribe/ship-hold-migration.svg?style=svg)](https://circleci.com/gh/zorro-del-caribe/ship-hold-migration)
migration adapter for [ship-hold](https://github.com/zorro-del-caribe/ship-hold)

## install
``npm install ship-hold-migration [--save|--save-dev]``
## usage

```Javascript
const sh = require('ship-hold')(/* your connection options */);
const mig=require('ship-hold-migration');

mig(sh);

const migrator = sh.migratior();

migrator.up()
    .then(function(){
        return migrator.down();
    });
```


### migration file 
A migration file must contains **up** (executing a migration) and **down** (rolling back a migration) methods which return *Promise*; and a **timestamp** property referring to the creation date of the migration (so migration can be ordered)
You can optionally add a **name** property otherwise it will use the file name (without the extension) as default

```Javascript
//myMigration.js

module.exports = {
    name:'createUserTable',
    timestamp:12312423423,
    up(sh){
    //code to execute for the migration (sh is the shiphold instance)
        return sh.getConnection()
            .then(function ({client, done})
                return new Promise(function(resolve,reject){
                    client.query(`
                    CREATE TABLE users(
                        id serial PRIMARY KEY,
                        name varchar(128)
                    );
                    `, function(err,res){
                        if(err)
                            return reject(err);
                        resolve(res);
                    });
                });
            });
    },
    down(sh){
    //code to execute in case of rollback
        return sh.getConnection()
                    .then(function ({client, done})
                        return new Promise(function(resolve,reject){
                            client.query(`
                            DROP TABLE users
                            `, function(err,res){
                                if(err)
                                    return reject(err);
                                resolve(res);
                            });
                        });
                    });
    }
}
```

### options
Options to pass to the adapter factory
* modelName: the name of the model used to store meta data related to the migrations (default: migrations)
* tableName: the name of the table used to store meta data related to the migrations (default: shiphold_migrations)
* directory: the path to the directory containing the migrations file (default:'/migrations')

##api
### up
Run all pending migrations; returns a *Promise* which resolve with successful migrations object (as an array)
### down
rollback the last migration; returns a *Promise* which resolve with successful migrations object (as an array)
### pending
return a *Promise* which resolves with the names of the pending migrations (as an array):
### executed
return a *Promise* which resolves with the names of the already executed migrations (as an array):
### list
return a *Promise* which resolves with the names of all migrations (as an array)
### migrations
return a *Promise* which resolves with all the migrations objects (as an array)
### model
Find or create the model related to migrations meta data. resolve a *Promise* with that model.
 
 
