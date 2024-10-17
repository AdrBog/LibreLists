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
 * Fetches all records from a specified table in a given database.
 *
 * @param {string} database - The name of the database to query.
 * @param {string} tableName - The name of the table from which to retrieve records.
 * @param {string} filter - A filter string to apply to the records (e.g., conditions for selection).
 * @param {string} [columns="*"] - A comma-separated list of columns to retrieve. Defaults to "*" (all columns).
 * @param {number} [limit=100] - The maximum number of records to return. Defaults to 100.
 * @param {number} [offset=0] - The number of records to skip before starting to collect the result set. Defaults to 0.
 * @returns {Promise<Object>} A promise that resolves to an object containing the retrieved records.
 * @throws {Error} Throws an error if the fetch request fails or if the response is not valid JSON.
 *
 * @example
 * getTableRecords('myDatabase', 'myTable', 'status=active')
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error fetching records:', error));
 */
async function getTableRecords(database, tableName, filters, columns = "*", limit = 100, offset = 0) {
    const requestBody = {
        filters: filters,
        columns: columns,
        limit: limit,
        offset: offset
    };

    const res = await fetch(`/json/table/${database}/${tableName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!res.ok)
        throw new Error(`Failed to fetch records: ${res.status} ${res.statusText}`);
    

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
async function getDatabaseConfig(database, key, defaultValue = "") {
    try {
        const data = await fetch(`/download/row/${database}/${DATABASE_CONFIG_TABLE}?pk_col=KEY&pk_val=${key}&c=VALUE`);
        if (!data.ok) {
            return defaultValue;
        }
        return await data.text();
    } catch (error) {
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
async function getTableColumns(database, tableName, columns = "*") {
    const tableInfo = await fetch(`/get_table_config/${database}/${tableName}`);
    const json = await tableInfo.json();
    const allColumns = json["table_config"]["columns"];

    if (columns !== "*") {
        let columnOrder = columns.split(",").map(col => col.trim());

        const validColumns = allColumns.map(col => col.name);
        
        columnOrder = columnOrder.filter(colName => validColumns.includes(colName));
        
        allColumns.forEach(col => {
            if (!columnOrder.includes(col.name)) {
                columnOrder.push(col.name);
            }
        });

        newColumnString = columnOrder.join(", ");

        const orderedColumns = columnOrder.map(colName => 
            allColumns.find(col => col.name === colName)
        );

        return orderedColumns;
    }

    return allColumns;
}

async function updateColumnConfig(database, tableName, columnName, updatedData) {
    const formData = new FormData();
    formData.append('column-name', columnName);
    for (const [key, value] of Object.entries(updatedData)) {
        formData.append(key, value);
    }

    try {
        const response = await fetch(`/create/column/${database}/${tableName}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}


async function countRowsInTable(database, tableName){
    const response = await fetch(`/count/rows/${database}/${tableName}`);
    const count = await response.text();
    return parseInt(count);
}