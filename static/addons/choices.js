/*
    This extension generates datalist in the add and edit record 
    dialogs when the CHECK (X IN (A, B, ...)) constraint is detected.
*/
async function createOptions(){
    const currentPath = window.location.pathname.split("/");
    const databaseName = currentPath[3];
    const tableName = currentPath[4];
    const query = `select sql from sqlite_master where sql like "%create%${tableName} %" or sql like "%create%${tableName}(%"`
    const regex = / CHECK([^)]+)IN ?\(([^)]+)\)/gi
    const res = await SQLQuery(databaseName, query);
    const resRecord = res["output"]["records"][0]["sql"];
    const matches = resRecord.match(regex);
    let datalists = [];
    if (!matches)
        return;
    for (const match of matches)
        datalists.push(extractMatches(match))
    addDatalists(datalists);
}

function extractMatches(check){
    const columnNameRegex = /(?<=\()(.*?)(?=\in)/gi
    const optionsRegex = /(?<=\IN ?\([^()]*?)\w+/gi
    const obj = {}
    columnName = check.match(columnNameRegex)[0].trim();
    arrays = check.match(optionsRegex);
    obj[columnName] = arrays;
    return obj;
}

function addDatalists(datalists){
    for (const datalist of datalists) {
        const keyName = Object.keys(datalist)[0];
        const element = document.querySelector(`input[column="${keyName}"]`);
        const listID = "list_for_" + keyName;
        const list = document.createElement("datalist");
        list.id = listID;
        element.setAttribute("list", listID);
        for (const option of datalist[keyName]) {
            const optionElement = document.createElement("option");
            optionElement.value = option;
            list.append(optionElement)
        }
        element.insertAdjacentElement("beforeend", list)
    }
}

document.addEventListener("generation-done", () => createOptions())