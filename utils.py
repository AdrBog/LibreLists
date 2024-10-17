import sqlite3, os, json

# PROJECT_DIR is the base directory where database files are stored.
PROJECT_DIR = os.path.join(os.path.expanduser('~'), 'LibreLists')

def get_db_connection(id):
    """
    Establishes a connection to a SQLite database.

    This function creates a connection to a SQLite database file located in a 
    directory specified by the PROJECT_DIR constant. The database file is named 
    after the provided `id` parameter.

    Parameters:
    id (str): The identifier used to locate the database file. The database 
              file will be located at '{PROJECT_DIR}/{id}/{id}.db'.

    Returns:
    sqlite3.Connection: A connection object to the specified SQLite database.

    Raises:
    sqlite3.Error: If the connection to the database cannot be established.
    """
    conn = sqlite3.connect(f'{PROJECT_DIR}/{id}/{id}.db')
    conn.row_factory = sqlite3.Row
    return conn


def get_tables_and_columns_from_db(id):
    # Connect to the SQLite database
    conn = get_db_connection(id)
    cursor = conn.cursor()
    
    # Get the list of tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    db_structure = {}
    
    for table in tables:
        table_name = table[0]
        cursor.execute(f'PRAGMA table_info("{table_name}")')
        columns = [
            {
                "cid": column[0],
                "name": column[1],
                "type": column[2],
                "required": column[3] == 1,
                "default_value": column[4],
                "pk": column[5]
            }
            for column in cursor.fetchall()
        ]
        db_structure[table_name] = columns
    
    # Close the connection
    conn.close()
    
    return db_structure

def synchronize_json_with_db(id):
    db_structure = get_tables_and_columns_from_db(id)
    config_file_path = os.path.join(PROJECT_DIR, id, "config.json")
    
    if os.path.exists(config_file_path):
        with open(config_file_path, 'r') as json_file:
            json_data = json.load(json_file)
    else:
        json_data = {}
    
    # Synchronize tables
    json_tables = json_data.get("tables", {})
    
    # Remove tables that are not in the database
    for table in list(json_tables.keys()):
        if table not in db_structure:
            del json_tables[table]
    
    # Add tables that are in the database but not in the JSON
    for table, columns in db_structure.items():
        if table not in json_tables:
            json_tables[table] = {"columns": columns}
        else:
            # Synchronize columns for existing tables
            json_columns = json_tables[table].get("columns", [])
            json_column_names = {col['name'] for col in json_columns}
            db_column_names = {col['name'] for col in columns}
            
            # Remove columns that are not in the database
            json_tables[table]['columns'] = [
                col for col in json_columns if col['name'] in db_column_names
            ]
            
            # Add columns that are in the database but not in the JSON
            for col in columns:
                if col['name'] not in json_column_names:
                    json_tables[table]['columns'].append(col)
    
    # Write the updated JSON back to the file
    with open(config_file_path, 'w') as json_file:
        json.dump({"tables": json_tables}, json_file, indent=4)

def rename_column(id, table, old_column_name, column_name):
    try:
        conn = get_db_connection(id)
        cursor = conn.cursor()
        cursor.execute(f'ALTER TABLE "{table}" RENAME COLUMN "{old_column_name}" TO "{column_name}";')
        conn.commit()
    finally:
        conn.close()

def add_column_from_json(id, table, column_info):

    column_name = column_info.get("name")
    column_type = column_info.get("type", "TEXT")
    required = column_info.get("required", False)
    default_value = column_info.get("default_value", None)
    unique = column_info.get("unique", False)

    constraints = []
    if required:
        constraints.append("NOT NULL")
    if unique:
        constraints.append("UNIQUE")
    if default_value:
        default_value = default_value.replace("'", "''")
        constraints.append(f"DEFAULT '{default_value}'")

    constraints_clause = " ".join(constraints)
    if constraints_clause:
        constraints_clause = " " + constraints_clause

    sql_command = f'ALTER TABLE "{table}" ADD COLUMN "{column_name}" {column_type}{constraints_clause};'

    conn = get_db_connection(id)
    cursor = conn.cursor()

    try:
        print(sql_command)
        cursor.execute(sql_command)
    except sqlite3.Error as e:
        raise
    finally:
        conn.commit()
        conn.close()