/*
    This addon allows you to execute scripts when an event is registered.
    This way you can automate some processes.
*/

window.addEventListener("record-inserted", (e) => {
    /**
     * Event details:
     * databaseName: The name of the database
     * tableName: The name of the table
     * record: Object representing the created record
     */
    
    //console.log(e.detail);
})

window.addEventListener("record-edited", (e) => {
    /**
     * Event details:
     * databaseName: The name of the database
     * tableName: The name of the table
     * record: Object representing the edited record
     */
    
    //console.log(e.detail);
})

window.addEventListener("record-deleted", (e) => {
    /**
     * Event details:
     * databaseName: The name of the database
     * tableName: The name of the table
     * record: Object representing the deleted record
     */
    
    //console.log(e.detail);
})