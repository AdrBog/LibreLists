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
const VALID_NAME_WITH_SPACES = /^(?!\s)[a-zA-Z0-9_ ]{1,50}(?<!\s)$/g;
const DATABASE_CONFIG_TABLE = "database_config";
const LIBRE_LISTS_DB = "LibreLists";

/**
 * Checks if a text string is valid (no spaces or special characters).
 * @param {*} string 
 * @returns 
 */
function isValid(string, regex = VALID_NAME){
    regex.lastIndex = 0;
    return regex.test(string);
}

function fancyText(string){
    return string.charAt(0).toUpperCase() + string.slice(1).replace(/_/g, " ");
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
async function getTableRecords(database, tableName, filter, columns = "*", limit = 100, offset = 0) {
    const res = await fetch(`/json/table/${database}/${tableName}?f=${filter}&c=${columns}&limit=${limit}&offset=${offset}`);
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
 * Returns a value from the Libre Lists database file.
 * @param {*} key 
 * @returns 
 */
async function getLibreListsConfig(key, defaultValue = ""){
    const data = await SQLQuery(LIBRE_LISTS_DB, `select VALUE from Preferences where KEY = "${key}"`);
    try {
        return data["output"]["records"][0]["VALUE"];
    } catch {
        return defaultValue;
    }
}

/**
 * Returns a value from a database information file.
 * @param {*} database 
 * @param {*} key 
 * @returns 
 */
async function getDatabaseConfig(database, key, defaultValue = ""){
    const data = await SQLQuery(database, `select VALUE from ${DATABASE_CONFIG_TABLE} where KEY = "${key}"`);
    try {
        return data["output"]["records"][0]["VALUE"];
    } catch {
        return defaultValue;
    }   
}

/**
 * Create or replace a database configuration key
 * @param {*} key 
 * @param {*} value 
 * @returns 
 */
async function setLibreListsConfig(key, value){
    const data = await SQLQuery(LIBRE_LISTS_DB, `insert or replace into Preferences values ("${key}", "${value}")`);
    return data;
}

/**
 * Create or replace a database configuration key
 * @param {*} database 
 * @param {*} key 
 * @param {*} value 
 * @returns 
 */
async function setDatabaseConfig(database, key, value){
    const data = await SQLQuery(database, `insert or replace into ${DATABASE_CONFIG_TABLE} values ("${key}", "${value}")`);
    return data;
}

async function getTableCreationInfo(database, tableName){
    const query = `select sql from sqlite_master where sql like "%create%${tableName}_%"`;
    const res = await SQLQuery(database, query);
    return res["output"]["records"][0]["sql"];
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
async function getTableColumns(database, tableName, columns = "*"){
    const tableInfo = await SQLQuery(database, `pragma table_info('${tableName}')`);
    const sequence = await SQLQuery(database, `select * from sqlite_sequence where name='${tableName}'`);
    let columnArray = []
    let columnList = (columns == "*") ? tableInfo["output"]["records"] : columns.split(",").map((x) => {
        return tableInfo["output"]["records"].filter((e) => {
            return e["name"].toLowerCase() == x.toLowerCase()
        })[0]
    })
    columnList = columnList.filter(function(x) { return x !== undefined; })
    for (const x in columnList){
        if (!columnList[x]) continue;
        let columnInfo = {}
        columnInfo["Name"] = columnList[x]["name"];
        columnInfo["Type"] = columnList[x]["type"];
        columnInfo["NotNull"] = columnList[x]["notnull"];
        columnInfo["PK"] = columnList[x]["pk"];
        if (sequence["response"] != "Error")
            if (columnInfo["PK"] != 0 && sequence["output"]["records"].length > 0)
                columnInfo["Sequence"] = sequence["output"]["records"][0]["seq"];
        columnArray.push(columnInfo);
    }
    return columnArray;
}