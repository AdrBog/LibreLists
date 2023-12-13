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
    td.innerText = value;
    return td;
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
            "TEXT": "TEXT",
            "VARCHAR": "VARCHAR",
            "LONGVARCHAR": "LONGVARCHAR",
            "NUMBER": "NUMBER",
            "INTEGER": "INTEGER",
            "REAL": "REAL",
            "BOOLEAN": "BOOLEAN",
            "DATE": "DATE",
            "COLOR": "COLOR",
            "BLOB": "BLOB"
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
    columnName.placeholder = "NAME";
    columnName.value = name;
    columnExtra.placeholder = "EXTRA (E.G. DEFAULT, CHECK)";
    columnExtra.setAttribute("list", "default-options");
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

    deleteButton.innerText = "X";
    deleteButton.setAttribute("delete", true);

    columnName.title = "Column name";
    columnType.title = "The type of information to be stored, note that SQLite does not usually check if the type of information is valid.";
    columnPrimaryKey.title = "Sets the PRIMARY KEY or UNIQUE contraint, this option does not usually work once the table is created.";
    columnNull.title = "Sets the NOT NULL or AUTOINCREMENT contraint, note that AUTOINCREMENT only works in INTEGER PRIMARY KEY";
    columnExtra.title = "Add extra constraints, such as DEFAULT or CHECK";

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
    const checkbox = document.createElement("input");
    const span = document.createElement("span");
    const input = document.createElement("input");
    const select = document.createElement("select");
    const textarea = document.createElement("textarea");
    let listOfTd = [checkbox, span, input];
    const BOOLEAN_OPTIONS = [0, 1];

    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("type2", "checkbox");
    checkbox.setAttribute("name", column["Name"]);
    for (const element of [input, select, textarea]) {
        element.setAttribute("type2", "input");
        element.setAttribute("column", column["Name"]);
        element.setAttribute("name", column["Name"]);
    }

    span.style.minWidth = "100px";
    span.innerText = column["Name"];

    if (column["Sequence"])
        input.value = column["Sequence"] + 1;
    else 
        checkbox.setAttribute("checked", true);

    switch(column["Type"].toUpperCase()){
        case "INTEGER":
        case "REAL":
        case "NUMBER":
            input.setAttribute("type", "number");
            break;
        case "DATE":
            input.setAttribute("type", "date");
            break;
        case "COLOR":
            input.setAttribute("type", "color");
            break;
        case "VARCHAR":
        case "LONGVARCHAR":
            listOfTd = [checkbox, span, textarea];
            break;
        case "BOOL":
        case "BOOLEAN":
            for (const booleanOption of BOOLEAN_OPTIONS)
                appendOptionToSelect(booleanOption, booleanOption, select);
            listOfTd = [checkbox, span, select];
            break;
        case "BLOB":
            checkbox.removeAttribute("checked");
            checkbox.setAttribute("disabled", "disabled");
            span.setAttribute("disabled", "disabled");
            input.setAttribute("disabled", "disabled");
            input.title = "Can't handle binary data";
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