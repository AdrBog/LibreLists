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

/**
 * In utils.js you will find useful functions to build the GUI,
 * make it easy to generate interactive tables and forms.
 */

function setAttributes(el, attrs) {
    for(var key in attrs)
        el.setAttribute(key, attrs[key]);
}

function appendOptionToSelect(innerText, value, select, selectedValue = ""){
    const option = document.createElement("option");
    option.innerText = innerText;

    if (value == selectedValue)
        option.selected = true;

    option.value = value;
    select.append(option);
}

function generateTableHeader(columns){
    const tr = document.createElement("tr");
    for (const column of columns) {
        const th = document.createElement("th");
        th.id = "button_" + column["Name"];
        th.setAttribute("entry-type", column["Type"]);
        th.setAttribute("entry-pk", column["PK"]);
        th.innerText = column["Name"];
        tr.append(th);
    }
    return tr;
}

function generateTableRecord(column, value){
    const td = document.createElement("td");
    td.setAttribute("entry-pk", column["PK"]);
    td.setAttribute("entry-type", column["Type"]);
    td.setAttribute("value", value);
    td.setAttribute("column", column["Name"]);
    switch (column["Type"]) {
        case "URLDATA":
            td.innerHTML = `<img src="${value}">`;
            break;
        case "IMAGE":
            if (value)
                td.innerHTML = `<img src="data:image/png;base64,${value}" alt="Image" />`;
            break;
        case "PDF":
            if (value)
                td.innerHTML = `<a href="data:application/pdf;base64,${value}" target="_blank"/>View File</a>`;
            break;
        case "BLOB":
            if (value != null){
                let [mime_type, data] = value.split("#", 2);
                if (mime_type.startsWith("image/"))
                    td.innerHTML = `<img src="data:${mime_type};base64,${data}" alt="Image" />`;
                else {
                    const button = document.createElement("button");
                    button.innerText = "View file";
                    button.addEventListener("click", () => {
                        const decodedString = atob(data);
                        const byteNumbers = new Uint8Array(decodedString.length);
                        for (let i = 0; i < decodedString.length; i++) {
                            byteNumbers[i] = decodedString.charCodeAt(i);
                        }
                        const dataBlob = new Blob([byteNumbers], { type: mime_type });
                        const url = URL.createObjectURL(dataBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.target = "blank";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    })
                    td.appendChild(button);
                    //td.innerHTML = `<a href="data:${mime_type};base64,${data}" target="_blank"/>View File</a>`;
                }
            }
            
            break;
        case "URL":
            td.innerHTML = `<a href="${value}">${value}</a>`;
            break;
        case "EMAIL":
            td.innerHTML = `<a href="mailto:${value}">${value}</a>`;
            break;
        default:
            td.innerText = value;
            break;
    }  
    return td;
}

function generateChunk(node, records, columns){
    for (const record of records) {
        const tr = document.createElement("tr");
        for (const column of columns)
            tr.appendChild(generateTableRecord(column, record[column["Name"]]));
        tr.addEventListener("dblclick", () => editRecordDialog(tr))
        node.appendChild(tr);
    }
}

function generateTable(records, columns){
    const table = document.createElement("table");

    table.appendChild(generateTableHeader(columns));

    for (const record of records) {
        const tr = document.createElement("tr");
        for (const column of columns)
            tr.appendChild(generateTableRecord(column, record[column["Name"]]));
        table.appendChild(tr);
    }

    return table;
}

function addColumnField(name = "", type = "TEXT", constraint = "", _null = "", _delete = true){
    const options = {
        "columnType":{
            "Image": "IMAGE",
            "File": "BLOB",
            "Boolean": "BOOLEAN",
            "Color": "COLOR",
            "Date": "DATE",
            "Date and time": "DATETIME",
            "Email": "EMAIL",
            "Number": "INTEGER",
            "Month": "MONTH",
            "Text": "TEXT",
            "Time": "TIME",
            "URL": "URL",
            "Long text": "VARCHAR",
            "Week": "WEEK",
        },
        "columnPrimaryKey":{
            "": "",
            "PRIMARY KEY": "PRIMARY KEY",
            "UNIQUE": "UNIQUE"
        },
        "columnNull": {
            "": "",
            "NOT NULL": "NOT NULL",
            "AUTOINCREMENT": "AUTOINCREMENT"
        }
    };
    const datalist = ["DEFAULT CURRENT_TIMESTAMP", "DEFAULT (DATE('NOW'))", "CHECK (X IN ('A', 'B'))"];
    const div = document.createElement("div");
    const columnName = document.createElement("input");
    const columnType = document.createElement("select");
    const columnPrimaryKey = document.createElement("select");
    const columnNull = document.createElement("select");
    const columnExtra = document.createElement("input");
    const columnExtraList = document.createElement("datalist");
    const deleteButton = document.createElement("button");

    div.classList.add("item");

    deleteButton.innerText = "X";
    setAttributes(deleteButton, {
        "delete": true,
        "type": "button"
    })

    setAttributes(columnName, {
        "title": "Column name", 
        "placeholder": "NAME",
        "value": name,
        "name": "column-name",
        "pattern": "^(?!\\s)[a-zA-Z0-9_ ]{1,50}(?<!\\s)$",
        "required": true
    })

    setAttributes(columnType, {
        "title": "The type of information to be stored, note that SQLite does not usually check if the type of information is valid.",
        "name": "column-type"
    })

    setAttributes(columnPrimaryKey, {
        "title": "Sets the PRIMARY KEY or UNIQUE contraint, this option does not usually work once the table is created.",
        "name": "column-pk"
    })

    setAttributes(columnNull, {
        "title": "Sets the NOT NULL or AUTOINCREMENT contraint, note that AUTOINCREMENT only works in INTEGER PRIMARY KEY",
        "name": "column-null"
    })

    setAttributes(columnExtra, {
        "title": "Add extra constraints, such as DEFAULT or CHECK",
        "placeholder": "EXTRA (E.G. DEFAULT, CHECK)",
        "list": "default-options",
        "name": "column-extra"
    })

    columnExtraList.id = "default-options";

    for (const key of datalist) {
        const option = document.createElement("option");
        option.value = key;
        columnExtraList.append(option);
    }

    for (const key in options)
        for (const opt in options[key])
            appendOptionToSelect(opt, options[key][opt], eval(key),
                (key == "columnType") ? type :
                (key == "columnPrimaryKey") ? constraint : _null
            )

    div.append(columnName, columnType, columnPrimaryKey, columnNull, columnExtra, columnExtraList);
    if (_delete)
        div.append(deleteButton);
    
    return div;
}

function getPrimaryKeyColumn(columnList){
    for (const column of columnList) {
        if(column["PK"] != 0)
            return column["Name"];
    }
    return undefined;
}

function addRowField(column){
    const tr = document.createElement("tr");
    const label = document.createElement("label");
    const input = document.createElement("input");
    const select = document.createElement("select");
    const textarea = document.createElement("textarea");
    let listOfTd = [label, input];
    const BOOLEAN_OPTIONS = [0, 1];
    
    for (const element of [input, select, textarea]){
        setAttributes(element, {
            "name": column["Name"],
            "id": column["Name"] 
        })
        if (column["NotNull"] != 0)
            element.setAttribute("required", true);
    }
        

    setAttributes(label, {
        "for": column["Name"],
        "style": "min-width: 100%;"
    })
    
    label.innerText = column["Name"];

    if (column["Sequence"])
        input.value = column["Sequence"] + 1;

    switch(column["Type"].toUpperCase()){
        case "INTEGER":
        case "INT":
        case "BIGINT":
        case "REAL":
        case "NUMBER":
        case "NUMERIC":
            input.setAttribute("type", "number");
            break;
        case "DATE":
            input.setAttribute("type", "date");
            break;
        case "TIME":
            input.setAttribute("type", "time");
            break;
        case "DATETIME":
            input.setAttribute("type", "datetime-local");
            break;
        case "MONTH":
            input.setAttribute("type", "month");
            break;
        case "WEEK":
            input.setAttribute("type", "week");
            break;
        case "COLOR":
            input.setAttribute("type", "color");
            break;
        case "EMAIL":
            input.setAttribute("type", "email");
            break;
        case "URLDATA":
            input.setAttribute("type", "file");
            tr.setAttribute("file", true);
            break;
        case "URL":
            input.setAttribute("type", "url");
            break;
        case "NVARCHAR":
        case "VARCHAR":
        case "LONGVARCHAR":
            listOfTd = [label, textarea];
            break;
        case "BOOL":
        case "BOOLEAN":
            for (const booleanOption of BOOLEAN_OPTIONS)
                appendOptionToSelect(booleanOption, booleanOption, select);
            listOfTd = [label, select];
            break;
        case "IMAGE":
            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/*");
            tr.setAttribute("file", true);
            break;
        case "PDF":
            input.setAttribute("type", "file");
            input.setAttribute("accept", "application/pdf");
            tr.setAttribute("file", true);
            break;
        case "BLOB":
            input.setAttribute("type", "file");
            tr.setAttribute("file", true);
            break;
        default:
            input.setAttribute("type", "text");
            break;
    }
    
    for (const td of listOfTd) {
        const e = document.createElement("td");
        e.append(td);
        tr.append(e);
    }
    return tr;
}

function getRecordFromTr(tr){
    const record = {};
    for (const cell of tr.querySelectorAll("td"))
        record[cell.getAttribute("column")] = cell.innerText;
    return record;
}

function getRecordFromForm(form){
    const record = {}
    for (const label of form.querySelectorAll("label")) {
        const column = label.innerText;
        record[column] = form.querySelector(`[id="${column}"]`).value;
    }
    return record;
}

function compareRecords(oldRecord, newRecord){
    const record = {}
    for (const key in oldRecord) {
        if (newRecord[key])
            if (newRecord[key] != oldRecord[key])
                record[key] = newRecord[key]
            else
                record[key] = oldRecord[key]
        else
            record[key] = oldRecord[key]
    }
    return record;
}

function getTableColumnsNames(table){
    return Array.from(table.querySelectorAll("th")).map((x) => {
        return x.innerText
    })
}