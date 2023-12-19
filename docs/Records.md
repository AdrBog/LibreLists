# Records

## Table of contents

- [Introduction](#introduction)
- [How to get records](#how-to-get-records)
    - [getRecordFromTr()](#getrecordfromtr)
    - [getRecordFromForm()](#getrecordfromform)
- [How to use records](#how-to-use-records)
    - [insertRecord()](#insertrecord)
    - [updateRecord()](#updaterecord)
    - [deleteRecord()](#deleterecord)
- [Variables](#variables)

## Introduction

A record is an object that represents a row of a table.

As an example, see the following table:

**Database name:** "admin" <br>
**Table name:** "employees"

| ID | Name | Email
|--|--|--
| 1 | Alice | alice@fakemail.com
| 2 | Bob | bob@fakemail.com

The corresponding records would be:

```json
{
    "ID": 1,
    "Name": "Alice",
    "Email": "alice@fakemail.com"
}

{
    "ID": 2,
    "Name": "Bob",
    "Email": "bob@fakemail.com"
}
```

Records are a way to tell the program what data to insert, edit or delete in a table.

## How to get records

You can manually generate a record, although this would not be the most efficient way to do it.

Instead, in the **utils.js** file you will find two functions that will help you get a record

### getRecordFromTr()

This function generates a record for a given row of a table.

The cells in that row must have a **Column** attribute containing the name of the column to which they refer.

For example, we have the following tr:
```html
<tr id="sample-row">
    <td column="ID">1</td>
    <td column="Name">Alice</td>
    <td column="Email">alice@fakemail.com</td>
</tr>
```
```js
getRecordFromTr(document.getElementById("sample-row"))
/*
{
    "ID": 1,
    "Name": "Alice",
    "Email": "alice@fakemail.com"
}
*/
```

### getRecordFromForm()

This function generates a record given a filled form.

For the function to work correctly, the form must contain a label for each input, whose innerText must be the name of the column it refers to.

For example, we have the following form:
```html
<form>
    <label for="ID">ID</label>
    <input type="number" name="ID" id="ID">
    <label for="Name">Name</label>
    <input type="text" name="Name" id="Name">
    <label for="Email">Email</label>
    <input type="email" name="Email" id="Email">
</form>
```

Note that the values of the record will be the values of the form at the moment the function is executed.

Let us suppose that the form is filled in with the following data
```txt
ID:    [                   3 ]
Name:  [                Jhon ]
Email: [   jhon@fakemail.com ]
```

If we execute the function it will return the following

```js
getRecordFromForm(document.querySelector("form"))
/*
{
    "ID": 3,
    "Name": "Jhon",
    "Email": "jhon@fakemail.com"
}
*/
```

## How to use records

In the **global.js** file you will find useful functions to manipulate tables with records.

### insertRecord()

Inserts a record into a table

The syntax is as follows:<br>
**insertRecord(** *string* database, *string* tableName, *object* record **)**

As an example, let's add the record from the previous example to the table, remember that the sample database was called **admin** and the table was called **employees**.
```js
const record = getRecordFromForm(document.querySelector("form"))
await insertRecord("admin", "employees", record)
```
### updateRecord()

This function updates a record in a table according to a search condition.

The syntax is as follows:<br>
**updateRecord(** *string* database, *string* tableName, *object* record, *object* searchData **)**

For example, if we want to change the record that has the **ID** 1, the function would be:

```js
const record = getRecordFromForm(document.querySelector("form"))
await updateRecord("admin", "employees", record, {"ID": 1})
```
### deleteRecord()

This function deletes a record in a table according to a search condition.

The syntax is as follows:<br>
**deleteRecord(** *string* database, *string* tableName, *object* searchData **)**

For example, if we want to delete the record that has the **ID** 3, the function would be:

```js
await deleteRecord("admin", "employees", {"ID": 3})
```
<hr>
All three functions return a response.

In case of success:
```json
{
    "response": "OK"
}
```
In case of error:
```json
{
    "response": "Error",
    "why": "ERROR MESSAGE"
}
```

## Variables
Finally, in the **database editor** *(templates/edit.html)* there is the variable **currentRecord**.

**currentRecord** stores the record of the currently selected row. It is updated every time you click a table cell.