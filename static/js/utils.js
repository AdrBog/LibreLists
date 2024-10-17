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
        th.id = "button_" + column["name"];
        if (column["hidden"]) th.style.display = "none";
        th.setAttribute("entry-type", column["type"]);
        th.setAttribute("entry-pk", column["pk"] ?? 0);
        th.innerText = column["name"];
        tr.append(th);
    }
    return tr;
}

function generateTableRecord(column, value){
    const td = document.createElement("td");
    td.setAttribute("entry-pk", column["pk"]);
    td.setAttribute("entry-type", column["type"]);
    td.setAttribute("value", value);
    td.setAttribute("column", column["name"]);
    if (column["hidden"]) td.style.display = "none";
    switch (column["type"]) {
        case "URLDATA":
            td.innerHTML = `<img src="${value}">`;
            break;
        case "IMAGE":
        case "PDF":
        case "BLOB":
            if (value != null){
                let [mime_type, data] = value.split("#", 2);
                if (mime_type.startsWith("image/"))
                    td.innerHTML = `<img src="data:${mime_type};base64,${data}" alt="Image" />`;
                else {
                    const button = document.createElement("button");
                    button.innerText = "View file";
                    button.addEventListener("click", (e) => {
                        const target = e.target;
                        const tr = target.parentElement.parentElement;
                        const pK = tr.querySelector("[entry-pk='1']");
                        if (pK != null)
                            window.open(`/download/row/${DATABASE_ID}/${currentTable}?pk_col=${pK.getAttribute("column")}&pk_val=${pK.getAttribute("value")}&c=${column["name"]}`, "_target");
                        else
                            POP.alert("Can't view the file, it doesn't have a primary key")
                    })
                    td.appendChild(button);
                }
            }

            break;
        case "URL":
            if (value != null) {
                const a = document.createElement("a");
                a.href = value;
                a.innerText = value;
                td.append(a);
            }
            break;
        case "EMAIL":
            if (value != null) {
                const a = document.createElement("a");
                a.href = "mailto:" + value;
                a.innerText = value;
                td.append(a);
            }
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
            tr.appendChild(generateTableRecord(column, record[column["name"]]));
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
            tr.appendChild(generateTableRecord(column, record[column["name"]]));
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
        if(column["pk"] != 0)
            return column["name"];
    }
    return undefined;
}

function addRowField(column) {
    const tr = document.createElement("tr");
    const label = document.createElement("label");
    const input = document.createElement("input");
    const select = document.createElement("select");
    const textarea = document.createElement("textarea");
    let listOfTd = [label, input];

    for (const element of [input, select, textarea]) {
        setAttributes(element, { "name": column["name"], "id": column["name"] });
        if (column["required"]) element.setAttribute("required", column["required"]);
    }

    setAttributes(label, { "for": column["name"], "style": "min-width: 100%;" });
    label.innerText = column["name"];
    if (column["description"]) label.title = column["description"];
    if (column["sequence"]) input.value = column["sequence"] + 1;
    if ((column["pk"] ?? 0) > 0) input.setAttribute("required", true);

    const typeMap = {
        "INTEGER": "number", "INT": "number", "BIGINT": "number", "REAL": "number",
        "NUMBER": "number", "NUMERIC": "number", "DATE": "date", "TIME": "time",
        "DATETIME": "datetime-local", "MONTH": "month", "WEEK": "week", "COLOR": "color",
        "EMAIL": "email", "URL": "url", "URLDATA": "file", "BLOB": "file",
        "IMAGE": "file", "PDF": "file", "TEXT": "text"
    };

    const inputType = column["type"].toUpperCase();
    if (typeMap[inputType]) {
        input.setAttribute("type", typeMap[inputType]);
        if (column["custom_validation"]) input.setAttribute("pattern", column["custom_validation"])
        if (["URLDATA", "IMAGE", "PDF", "BLOB"].includes(inputType)) {
            tr.setAttribute("file", true);
            if (column["file_types"] && column["file_types"].length) {
                input.setAttribute("accept", column["file_types"].join(","));
            }
        } else if (["INTEGER", "INT", "BIGINT", "REAL", "NUMBER", "NUMERIC"].includes(inputType)) {
            if (column["min"]) input.setAttribute("min", column["min"]);
            if (column["max"]) input.setAttribute("max", column["max"]);
            if (column["decimal"]) input.setAttribute("step", "any");
        } else if (["TEXT"].includes(inputType)) {
            if (column["max_length"]) input.setAttribute("maxlength", column["max_length"]);
        } else if (["DATE", "DATETIME"].includes(inputType)){
            if (column["date_format"]) input.setAttribute("type", column["date_format"]);
        }
    } else if (["NVARCHAR", "VARCHAR", "LONGVARCHAR"].includes(inputType)) {
        listOfTd = [label, textarea];
        if (column["max_length"]) textarea.setAttribute("maxlength", column["max_length"]);
    } else if (["BOOL", "BOOLEAN"].includes(inputType)) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = column["name"];
        checkbox.id = column["name"];
        listOfTd = [label, checkbox];
    } else if (inputType === "CHOICES") {
        if (!column["allow_custom_values"]) {
            const selectChoice = document.createElement("select");
            selectChoice.id = column["name"];
            selectChoice.name = column["name"];
            [""].concat(column["choices"]).forEach(o => {
                const option = document.createElement("option");
                option.value = o;
                option.innerText = o;
                selectChoice.append(option);
            });
            listOfTd = [label, selectChoice];
        } else {
            const dataList = document.createElement("datalist");
            dataList.id = column["name"] + "_list";
            column["choices"].forEach(o => {
                const option = document.createElement("option");
                option.value = o;
                option.innerText = o;
                dataList.append(option);
            });
            document.body.append(dataList);
            input.setAttribute("list", column["name"] + "_list");
        }
    } else if (inputType === "DATE") {
        if (column["date_format"]) {
            input.setAttribute("type", column["date_format"]);
        }
    } else {
        input.setAttribute("type", "text");
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

function escapeSingleQuotes(value) {
    return value.replace(/'/g, "''");
}

function escapeSpecialCharacters(value) {
    return value.replace(/[%_ \\]/g, (match) => {
        return `\\${match}`;
    });
}

function quoteColumnName(column) {
    return `"${column}"`;
}

function jsonToSqlGroup(groups){
    let sqlParts = ""

    groups.forEach((v, i) => {
        sqlParts += `(${jsonToSqlString(v["conditions"])})`
        if (i != groups.length - 1)
            sqlParts += ` ${v["operator"]} `
    })
    
    return sqlParts;
}

function jsonToSqlString(filters) {
    if (filters.length == 0)
        return "";
    const sqlParts = filters.map((filter, index) => {
        const column = quoteColumnName(filter.column);
        let value;
        if (['contains','startsWith','endsWith'].includes(filter.operator))
            value = escapeSpecialCharacters(escapeSingleQuotes(filter.value))
        else
            value = escapeSingleQuotes(filter.value)
        let operator;

        switch (filter.operator) {
            case 'equal':
                operator = '=';
                return `${column} ${operator} '${value}'`;
            case 'contains':
                operator = 'LIKE';
                return `${column} ${operator} '%${value}%' ESCAPE '\\'`;
            case 'startsWith':
                operator = 'LIKE';
                return `${column} ${operator} '${value}%' ESCAPE '\\'`;
            case 'endsWith':
                operator = 'LIKE';
                return `${column} ${operator} '%${value}' ESCAPE '\\'`;
            case 'greater':
                operator = '>';
                return `${column} ${operator} '${value}'`;
            case 'less':
                operator = '<';
                return `${column} ${operator} '${value}'`;
            case 'greaterOrEqual':
                operator = '>=';
                return `${column} ${operator} '${value}'`;
            case 'lessOrEqual':
                operator = '<=';
                return `${column} ${operator} '${value}'`;
            case 'different':
                operator = '!=';
                return `${column} ${operator} '${value}'`;
            case 'customLike':
                operator = 'LIKE';
                return `${column} ${operator} '${value}' ESCAPE '\\'`;
            default:
                throw new Error(`Unsupported operator: ${filter.operator}`);
        }
    });
    
    filters.forEach((v, i) => {
        if (i != filters.length - 1)
            sqlParts[i] += ` ${v.logicalOperator} `;
    })

    return sqlParts.join(" ");
}

function loadLSConfig(){
    const json = localStorage['config'] || '{}';
    return JSON.parse(json)
}

function setLSConfig(key, value){
    if (config[DATABASE_ID] == undefined)
        config[DATABASE_ID] = {}
    config[DATABASE_ID][`t_${key}`] = value;
    localStorage['config'] = JSON.stringify(config);
}

function getLSConfig(key, defaultValue){
    if (config[DATABASE_ID] == undefined)
        config[DATABASE_ID] = {}
    return config[DATABASE_ID][`t_${key}`] || defaultValue;
}

function editRow(row, data) {
    for (const d of data) {
        const td = row.querySelector(`[column="${d[0]}"]`);
        if (td != null){
            if (!["BLOB", "IMAGE", "PDF"].includes(td.getAttribute("entry-type"))) {
                td.setAttribute("value", d[1]);
                td.innerText = d[1];
            }
        }
    }
}
