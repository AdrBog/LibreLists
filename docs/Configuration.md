# Configuration

## Table of contents

- [Configure Libre Lists](#configure-libre-lists)
- [Configure a database](#configure-a-database)
- [Default keys](#default-keys)
    - [Libre Lists keys](#libre-lists-keys)
    - [Databases keys](#databases-keys)
- [Create and edit keys](#create-and-edit-keys)
- [Why do you store the configuration in SQLite tables?](#why-do-you-store-the-configuration-in-sqlite-tables)

## Configure Libre Lists
The Libre Lists configuration is stored in a SQLite database located in your **project directory**, with the name **LibreLists**

This database does not appear in the database list of the main page, but you can access it by clicking on **Preferences** in the Libre Lists main page toolbar.

You can get the value of a key using the **getLibreListsConfig()** function located in **global.js**.

The syntax is as follows:<br>
**getLibreListsConfig(** *string* key, [*string* defaultValue] **)**

This function will return the value of the given <var>key</var>, in case the key is not found, the value indicated in <var>defaultValue</var> will be returned.

Example:
```js
await getLibreListsConfig("Other_Apps_host", "http://127.0.0.1:5000")
```

## Configure a database

You can configure a database individually, in Libre Lists, the configuration of a database is found in a table in the database itself called **database_config**.

This table is hidden by default, but you can access it from the database editor by selecting **Database -> Config** in the toolbar.

This table is optional, you can edit a database that does not have a **database_config** table

You can get the value of a key using the **getDatabaseConfig()** function located in **global.js**.

The syntax is as follows:<br>
**getDatabaseConfig(** *string* database, *string* key, [*string* defaultValue] **)**

This function will return the value of the given <var>key</var>, in case the key is not found, the value indicated in <var>defaultValue</var> will be returned.

Example:
```js
await getDatabaseConfig("admin", "display_name", "My Database")
```

## Default keys

The following is a list of keys that are used in newly installed Libre Lists

### Libre Lists keys

| Key | Description |
|--|--|
| **Other_Apps_host** | Host where Other Apps runs |

### Databases keys

| Key | Description |
|--|--|
| **display_name** | Works as a nickname for your database |
| **hidden_tables** | Comma-separated list of tables that will not appear in the table list |

## Create and edit keys

If you are creating an addon, you can create or edit your own keys for the database configuration with the **setLibreListsConfig()** and **setDatabaseConfig()** function located in **global.js**.

The syntax is as follows:<br>
**setLibreListsConfig(** *string* key, *string* value **)**
**setDatabaseConfig(** *string* database, *string* key, *string* value **)**

Examples
```js
await setLibreListsConfig("custom_key", "1234")
```

```js
await setDatabaseConfig(DATABASE_ID, "custom_key", "5678")
```
Note: <var>DATABASE_ID</var> is a constant that stores the database id of the database the user is editing

Note that the keys are nothing more than records in the **database_config** table, alternatively you can modify the keys using SQLite statements.

## Why do you store the configuration in SQLite tables?

I used to have the configurations saved in some JSONs files and I had Python and JS functions to edit those files. 

But then I realized that saving the configuration in a SQLite table made more sense, I already have a SQLite database editor, I'm not going to program a JSON file editor because that's not the purpose of the program, and also because I'm fucking lazy.

This way I managed to simplify a lot the source code and regain my sanity.