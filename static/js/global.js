/*
  This file is part of Libre Lists

  Libre Lists is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Libre Lists is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Libre Lists.  If not, see <http://www.gnu.org/licenses/>.

*/

const VALID_NAME = /^[a-zA-Z0-9_]{1,50}$/g;

/**
 * Checks if a text string is valid (no spaces or special characters).
 * @param {*} string 
 * @returns 
 */
function isValid(string){
    VALID_NAME.lastIndex = 0;
    return VALID_NAME.test(string);
}

/**
 * Returns information about a database.
 * @param {*} database 
 * @returns 
 */
async function getJSONDatabase(database) {
    const res = await fetch("/json/database/" + database);
    const data = await res.json();
    return data;
}

/**
 * Returns information about the Libre Lists configuration file.
 * @returns 
 */
async function getJSONConfig() {
    const res = await fetch("/json/config");
    const data = await res.json();
    return data;
}

/**
 * Returns the existing tables of a database.
 * @param {*} database 
 * @returns 
 */
async function getTables(database) {
    const data = await getJSONDatabase(database);
    return data["tables"];
}

/**
 * Returns all records of a table
 * @param {*} database 
 * @param {*} tableName 
 * @param {*} filter 
 * @returns 
 */
async function getTable(database, tableName, filter) {
    const res = await fetch("/json/table/" + database + "/" + tableName + "?f=" + filter);
    const data = await res.json();
    return data;
}

/**
 * Allows to execute a SQL script on a database.
 * In the case of commands such as SELECT or PRAGMA, it also returns the records found.
 * @param {*} database 
 * @param {*} query 
 * @returns 
 */
async function SQLQuery(database, query) {
    const res = await fetch("/exec/" + database, {
        method: "POST",
        body: JSON.stringify({ "query": query }),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    });
    const resJSON = await res.json();
    return resJSON;
}

/**
 * Allows you to execute a single SQL query on a database.
 * It follows the Python SQLite3 syntax, in which you can combine ? with an array of variables,
 * e.g. query -> "INSERT INTO TABLE VALUES (?,?)", values -> "[name, age]"
 * @param {*} database 
 * @param {*} query 
 * @param {*} values 
 * @returns 
 */
async function simpleQuery(database, query, values = []) {
    let simpleQuery = {};
    simpleQuery["query"] = query;
    simpleQuery["values"] = values;
    const res = await fetch("/simplequery/" + database, {
        method: "POST",
        body: JSON.stringify({
            "info": simpleQuery,
        }),
        headers: {"Content-type": "application/json; charset=UTF-8"}
    });
    const resJSON = await res.json();
    return resJSON;
}

/**
 * THIS FUNCTION NEEDS TO BE EXECUTED
 */
async function deleteTable(database, tableName){
    const res = await SQLQuery(database, "DROP TABLE IF EXISTS " + tableName);
    if (res["response"] == "OK"){
        return tableName;
    } else {
        return null;
    }
}

/**
 * Returns a value from the Libre Lists configuration file.
 * @param {*} attributeName 
 * @returns 
 */
async function getConfig(attributeName){
    const res = await fetch("/json/config");
    const data = await res.json();
    return data[attributeName];
}

/**
 * Returns a value from a database information file.
 * @param {*} database 
 * @param {*} attributeName 
 * @returns 
 */
async function getInfo(database, attributeName){
    const res = await fetch("/json/database/" + database);
    const data = await res.json();
    return data["metadata"][attributeName];
}

async function getTableConfig(database, tableName, attributeName){
    const res = await fetch("/json/table/" + database + "/" + tableName);
    const data = await res.json();
    return data["table_config"][attributeName];
}

async function getTableCreationInfo(database, tableName){
    const query = `select sql from sqlite_master where sql like "%create%${tableName} %" or sql like "%create%${tableName}(%"`;
    const res = await SQLQuery(database, query);
    return res["output"]["records"][0]["sql"];
}

async function updateConfig(context, data, database = ""){
    const res = await fetch("/update", {
        method: "POST",
        body: JSON.stringify({
            "database": database,
            "context": context,
            "data": data
        }),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    });
    const resJSON = await res.json();
    return resJSON;
}

/**
 * Returns a string representing a CSV file based on a table.
 * @param {*} table 
 * @returns 
 */
function tableToCSV(table){
    csv = "";
    for (const tr of table.querySelectorAll("tr")){
        for (const td of tr.querySelectorAll("th, td"))
            csv += `"${td.innerText}",`
        csv += "\n";
    }
    return csv;
}

/**
 * Returns information about the columns of a table
 * @param {*} database 
 * @param {*} tableName 
 * @returns 
 */
async function getTableColumns(database, tableName){
    const tableInfo = await SQLQuery(database, `pragma table_info('${tableName}')`)
    const sequence = await SQLQuery(database, `select * from sqlite_sequence where name='${tableName}'`);
    let columns = []
    for (const x in tableInfo["output"]["records"]){
        let columnInfo = {}
        columnInfo["Name"] = tableInfo["output"]["records"][x]["name"];
        columnInfo["Type"] = tableInfo["output"]["records"][x]["type"];
        columnInfo["PK"] = tableInfo["output"]["records"][x]["pk"];
        if (columnInfo["PK"] != 0 && sequence["output"]["records"].length > 0)
            columnInfo["Sequence"] = sequence["output"]["records"][0]["seq"];
        columns.push(columnInfo);
    }
    return columns;
}