function appendOption(innerText, value, select, selectedValue = ""){
    const option = document.createElement("option");
    option.innerText = innerText;

    if (value == selectedValue)
        option.selected = true;

    option.value = value;
    select.append(option);
}

function tableHeaderWithMenu(column){
    const th = document.createElement("th");
    const button = document.createElement("button");
    button.classList.add("column-button");
    button.setAttribute("type", "column-button");
    button.id = "button_" + column["Name"];
    button.setAttribute("entry-type", column["Type"]);
    button.setAttribute("entry-pk", column["PK"]);
    button.setAttribute("onclick", `displayColMenu("${column["Name"]}")`);
    button.innerText = column["Name"];
    th.append(button);
    return th;
}

function tableCellEditable(column, value){
    const td = document.createElement("td");
    const button = document.createElement("button");
    button.classList.add("cell-button");
    button.setAttribute("type", "cell-button");
    button.setAttribute("entry-pk", column["PK"]);
    button.setAttribute("column", column["Name"]);
    button.innerText = value;
    td.append(button);
    return td;
}

function addColumnField(name = "", type = "TEXT", constraint = "", _null = "", _delete = true){
            
    const options = {
        "tableType":{
            "TEXT": "TEXT",
            "NUMBER": "NUMBER",
            "INTEGER": "INTEGER",
            "REAL": "REAL",
            "DATE": "DATE"
        },
        "tableConstraint":{
            "": "",
            "PRIMARY KEY": "PRIMARY KEY",
            "UNIQUE": "UNIQUE"
        },
        "tableNull": {
            "": "",
            "NOT NULL": "NOT NULL",
            "AUTOINCREMENT": "AUTOINCREMENT"
        }
    };
    const datalist = ["DEFAULT CURRENT_TIMESTAMP", "CHECK (X = 'true' or X = 'false')"];
    const div = document.createElement("div");
    const tableName = document.createElement("input");
    const tableType = document.createElement("select");
    const tableConstraint = document.createElement("select");
    const tableNull = document.createElement("select");
    const tableDefault = document.createElement("input");
    const tableDefaultList = document.createElement("datalist");
    const deleteButton = document.createElement("button");

    div.classList.add("item");
    tableName.placeholder = "NAME";
    tableName.value = name;
    tableDefault.placeholder = "EXTRA (E.G. DEFAULT, CHECK)";
    tableDefault.setAttribute("list", "default-options");
    tableDefaultList.id = "default-options";
    for (const key of datalist) {
        const option = document.createElement("option");
        option.value = key;
        tableDefaultList.append(option);
    }

    for (const key in options)
        for (const opt in options[key])
            appendOption(opt, options[key][opt], eval(key),
                (key == "tableType") ? type :
                (key == "tableConstraint") ? constraint : _null
            )

    deleteButton.innerText = "X";
    deleteButton.setAttribute("delete", true);

    div.append(tableName, tableType, tableConstraint, tableNull, tableDefault, tableDefaultList);
    if (_delete)
        div.append(deleteButton);
    
    return div;
}

function addRowField(column){
    const tr = document.createElement("tr");
    const span = document.createElement("span");
    const input = document.createElement("input");
    const listOfTd = [span, input];
    span.style.minWidth = "100px";
    span.innerText = column["Name"];
    switch(column["Type"]){
        case "INTEGER":
        case "REAL":
        case "NUMBER":
            input.setAttribute("type", "number");
            break;
        case "DATE":
            input.setAttribute("type", "date");
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