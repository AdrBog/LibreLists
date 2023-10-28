TABLE_DROPDOWN.appendChild(document.createElement("hr"));
addButtonToNavbar("Set SQLite Filter", "setSQLFilter()", TABLE_DROPDOWN);
addButtonToNavbar("Clear SQLite Filter", "clearSQLFilter()", TABLE_DROPDOWN);

function setSQLFilter(){
    if (!someTableIsSelected())
        return;
    filter = prompt("Enter filter options:", "WHERE ");
    select(currentTable);
}

function clearSQLFilter(){
    if (!someTableIsSelected())
        return;
    filter = "";
    select(currentTable);
}