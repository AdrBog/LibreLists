/*
    This extension generates datalist in the add and edit record 
    dialogs when the CHECK (X IN (A, B, ...)) constraint is detected.
*/
async function createOptions(){
    const regex = / CHECK([^)]+)IN ?\(([^)]+)\)/gi
    const matches = parent.currentTableCreateInfo.match(regex);
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
        const element = document.querySelector(`input[column=${keyName}]`);
        const listID = "list_for_" + keyName;
        const list = document.createElement("datalist");
        list.id = listID;
        try{
            element.setAttribute("list", listID);
            for (const option of datalist[keyName])
                appendOptionToSelect(option, option, list);
            element.insertAdjacentElement("beforeend", list);
        } catch {}
    }
}

document.addEventListener("generation-done", () => createOptions());