/*
    This add-on simplifies column reordering
*/

window.addEventListener("load", () => {
    const COLUMN_MENU = document.getElementById("column-menu");
    const MOVE_RIGHT = document.createElement("a");
    const MOVE_LEFT = document.createElement("a");
    const FIRST_ELEMENT = COLUMN_MENU.querySelector("a");

    MOVE_RIGHT.innerText = "Move Right >>";
    setAttributes(MOVE_RIGHT, {
        "href": "#",
        "onclick": "moveColumn(1)"
    })

    MOVE_LEFT.innerText = "<< Move Left";
    setAttributes(MOVE_LEFT, {
        "href": "#",
        "onclick": "moveColumn(-1)"
    })

    FIRST_ELEMENT.insertAdjacentElement("afterend", MOVE_LEFT);
    FIRST_ELEMENT.insertAdjacentElement("afterend", MOVE_RIGHT);
    FIRST_ELEMENT.insertAdjacentElement("afterend", document.createElement("hr"));
})

function moveArrayItem(array, oldIndex, newIndex) {
    while (oldIndex < 0)
        oldIndex += array.length;
    while (newIndex < 0) 
        newIndex += array.length;
    
    if (newIndex >= array.length) {
        var k = newIndex - array.length + 1;
        while (k--)
            array.push(undefined);
    }
    array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
    return array;
};

async function checkIfDatabaseConfigExist(){
    const data = await SQLQuery(DATABASE_ID, `SELECT name FROM sqlite_master WHERE type='table' AND name='${DATABASE_CONFIG_TABLE}'`)
    return data["output"]["records"].length
}

async function checkIfOrderExists(){
    const order = await getDatabaseConfig(DATABASE_ID, `table_${currentTable}_columns`, "*")
    if (order == "*"){
        const columnsNames = currentColumnNames.join(",")
        await setDatabaseConfig(DATABASE_ID, `table_${currentTable}_columns`, currentColumnNames.join(","))
        return columnsNames;
    }  
    return order
}

async function moveColumn(where){
    if (await checkIfDatabaseConfigExist() == 0){
        POP.alert(`Can't move columns without config table '${DATABASE_CONFIG_TABLE}'`);
        return;
    }
    let oldOrder = await checkIfOrderExists();
    oldOrder = oldOrder.split(",");
    let oldIndex = oldOrder.indexOf(selectedColumn);
    let newOrder = moveArrayItem(oldOrder, oldIndex, oldIndex + where);
    newOrder = newOrder.filter(function(x) { return x !== undefined; });
    await setDatabaseConfig(DATABASE_ID, `table_${currentTable}_columns`, newOrder);
    select(currentTable);
}