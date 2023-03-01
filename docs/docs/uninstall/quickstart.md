# Quickstart

Uninstalling Mathesar should only take a few minutes.

!!! info
    We've tested this uninstallation procedure on Windows, Mac, and a few Linux variants, but this is our first release so there might be unexpected issues. Please open a [GitHub issue](https://github.com/centerofci/mathesar/issues) if you run into any problems.


## Uninstall Mathesar
To completely remove Mathesar, go to Mathesar installation directory

```
cd <installation directory location>
```



## Remove Mathesar webserver container and related image:

```
sudo docker compose --profile prod down --rmi all
```


## Remove Mathesar config files:

```
cd .. && sudo rm -rf mathesar
```

## Removing Mathesar Schema from databases

If you had connected Mathesar to an existing database, mathesar would have installed a Schema for its internal use. You can also remove those schemas from the databases by:

#### Connecting to the database
```
psql -h <DB HOSTNAME> -p <DB PORT> -U <DB_USER> <DB_NAME>
```

#### Running the SQL command to delete the mathesar Schema

```postgresql
DROP SCHEMA mathesar_types;
```