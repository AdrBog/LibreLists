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

const validName = /^[a-zA-Z0-9_]{1,50}$/g;

function isValid(string){
    validName.lastIndex = 0;
    return validName.test(string);
}

function checkErrors(res, showAlert = true) {
    if (res["response"] == "Error"){
        if (showAlert){
            alert("An error ocurred:\n" + res["why"]);
        }
        return false;
    } else {
        return true;
    }
}

async function getJSONDatabase(database) {
    const res = await fetch("/json/database/" + database);
    const data = await res.json();
    return data;
}

async function getJSONConfig() {
    const res = await fetch("/json/config");
    const data = await res.json();
    return data;
}

async function getTables(database) {
    const data = await getJSONDatabase(database);
    return data["tables"];
}

async function getTable(database, tableName, filter) {
    const res = await fetch("/json/table/" + database + "/" + tableName + "?f=" + filter);
    const data = await res.json();
    return data;
}

async function SQLQuery(database, query) {
    const res = await fetch("/exec/" + database, {
        method: "POST",
        body: JSON.stringify({ "query": query }),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    });
    const resJSON = await res.json();
    return resJSON;
}

async function insertTable(database, tableName){
    const res = await SQLQuery(database, "CREATE TABLE " + tableName + "( id INTEGER PRIMARY KEY AUTOINCREMENT )");
    if (checkErrors(res)){
        return tableName;
    } else {
        return null;
    }
}

async function deleteTable(database, tableName){
    const res = await SQLQuery(database, "DROP TABLE IF EXISTS " + tableName);
    if (checkErrors(res)){
        return tableName;
    } else {
        return null;
    }
}

async function insertColumn(database, tableName, colName) {
    const res = await SQLQuery(database, "ALTER TABLE " + tableName + " ADD " + colName + " TEXT;");
    if (checkErrors(res)){
        return colName;
    } else {
        return null;
    }
}

async function deleteColumn(database, tableName, colName) {
    const res = await SQLQuery(database, "ALTER TABLE " + tableName + " DROP " + colName);
    if (checkErrors(res)){
        return colName;
    } else {
        return null;
    }
}

async function renameColumn(database, tableName, colName, newName) {
    const res = await SQLQuery(database, "ALTER TABLE " + tableName + " RENAME COLUMN " + colName + " TO " + newName);
    if(checkErrors(res)){
        return newName;
    } else {
        return null;
    }
}

async function insertRow(database, tableName) {
    const res = await SQLQuery(database, "INSERT INTO " + tableName + " DEFAULT VALUES");
    if(checkErrors(res)){
        return tableName;
    } else {
        return null;
    }
}

async function editCell(database, tableName, colName, idCol, id, newValue) {
    const res = await SQLQuery(database, "UPDATE " + tableName + " SET " + colName + " = '" + newValue + "' WHERE " + idCol + " = " + id);
    if(checkErrors(res)){
        return true;
    } else {
        return false;
    }
}

async function getConfig(attributeName){
    const res = await fetch("/json/config");
    const data = await res.json();
    return data[attributeName];
}

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

function JSONtoTable(json){
    const table = document.createElement("table");
    const trhead = document.createElement("tr");
    for (const col in json["header"]){
        const th = document.createElement("th");
        th.innerText = json["header"][col];
        trhead.appendChild(th)
    }
    table.append(trhead);

    for (const row of json["rows"]) {
        const tr = document.createElement("tr");
        for (const col in json["header"]){
            const td = document.createElement("td");
            td.innerText = row[json["header"][col]];
            tr.appendChild(td)
        }
        table.appendChild(tr);
    }
    return table;
}

function JSONtoCSV(json){
    csv = "";
    for (const col in json["header"])
        csv += "\"" + json["header"][col] + "\",";
    csv += "\n";
    for (const row of json["rows"]) {
        for (const col in json["header"])
            csv += "\"" + row[json["header"][col]] + "\",";
        csv += "\n";
    }
    return csv;
}