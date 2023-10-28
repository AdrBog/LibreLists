# global.js

global.js is an important file, here are stored functions and constants that will help you comunicate between the web app and the database.

These functions will also help you when creating addons for Libre Lists

It is located in static/js/global.js

## Constants
### validName

This constant is a regex that is used to check if a string is valid, this includes:

- String length is between 1 and 50
- It does not contain special characters (including spaces)

This is the regex:
```js
const validName = /^[a-zA-Z0-9_]{1,50}$/g;
```

## Functions
### isValid(string)
This function checks if the string is valid, then it returns true or false

Example:
```js
isValid("foobar");      // true
isValid("foo#bar");     // false
```

### SQLQuery(database, query)
This function executes a SQLite query in a database. JSON data is returned:
```json
{
    "response": "OK"
}
```
If there were no errors

```json
{
    "response": "Error",
    "why": "error message"
}
```
In case of errors

Example:
```js
const res = await SQLQuery("foo", "ALTER TABLE bar DROP column");
if (res["response"] == "Error"){
    console.log(res["why"]);
} 
```

### checkErrors(res, showAlert)
It returns true or false depending of the response JSON that you enter. It also shows an alert window in case of false return.

Example:
```js
const res = await SQLQuery("foo", "SELECT * FROM table");
if (checkErrors(res)){
    // The SQL Query worked
} else {
    // The SQL Query failed
}
```
If you don't want to display error message in case of error, add this:
```js
checkErrors(res, false)
```

### getConfig(attributeName)
This function returns a value from the config file.

Example: Let's say we want to get this value from the config file
```json
{
    "customAttribute": "hello world",
}
```
```js
const attribute = await getConfig("customAttribute");
```

### getJSONDatabase(database)
This function will return JSON data of database information.

Check the JSON data in your browser by entering the following URL: **"/json/database/" + database**

Example:
```js
const data = await getJSONDatabase(database);
```

### getTables(database)
This function will return an array of all tables of a database. Keep in mind that it won't return hidden tables

Example:
```js
const tables = await getTables("foo");
for (const table of tables) {
    console.log(table);
}
```

### getTable(database, tableName, filter)
Not to be mistaken with getTables(). This function will return JSON of table information. 

Example:
```js
// Without filters
const data = await getTable("foo", "bar");
// With filters
const data = await getTable("foo", "bar", "Name LIKE 'Jhon.*'");
```

### insertTable(database, tableName)
This function creates a new table in your database. Returns *tableName* if successful, in case of error it returns *null*

Example:
```js
if (await insertTable("foo", "bar")){
    // Table created
} else {
    // Error ocurred
}
```

### deleteTable(database, tableName)
This function deletes a table from a database. Returns *tableName* if successful, in case of error it returns *null*

Example:
```js
if (await deleteTable("foo", "bar")){
    // Table deleted
} else {
    // Error ocurred
}
```

### insertColumn(database, tableName, colName)
This function creates a new column in your table. Returns *colName* if successful, in case of error it returns *null*

Example:
```js
if (await insertColumn("foo", "bar", "col")){
    // Column created
} else {
    // Error ocurred
}
```

### deleteColumn(database, tableName, colName)
This functions deletes a column from a table. Returns *colName* if successful, in case of error it returns *null*

Example:
```js
if (await deleteColumn("foo", "bar", "col")){
    // Column created
} else {
    // Error ocurred
}
```

### renameColumn(database, tableName, colName, newName)
This function change the name of a column from a table. Returns *newName* if successful, in case of error it returns *null*

Example:
```js
if (await renameColumn("foo", "bar", "col", "ham")){
    // Column renamed
} else {
    // Error ocurred
}
```

### insertRow(database, tableName)
This function inserts an empty row in your table. Returns *tableName* if successful, in case of error it returns *null*

Example:
```js
if (await insertRow("foo", "bar")){
    // Row created
} else {
    // Error ocurred
}
```

### editCell(database, tableName, colName, idCol, id, newValue)
This function will edit a cell from you table, you need to specify the column, and the id of the item you want to change, also specify which column work as id. This returns true or false depending of if it worked.

Example:
```js
if (await editCell("foo", "bar", "col", "id", 0, "eggs")){
    // Cell edited
} else {
    // Error ocurred
}
```