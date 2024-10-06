import os, shutil, sqlite3, json, re
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_cors import CORS, cross_origin
from werkzeug.exceptions import abort


app = Flask(__name__)
CORS(app)
PROJECT_DIR = "projects"
CONFIG_DIR = "config"
ADDONS_FILE = "addons.json"
LIBRE_LISTS_DB = "LibreLists"
DATABASE_CONFIG_TABLE = "database_config"
TABLE_DEFAULT_CONFIG = {}
VERSION = "0.3.1"

# FUNCTIONS

def updateAddons():
    with open(f"{CONFIG_DIR}/{ADDONS_FILE}") as f:
        return json.load(f)

def get_db_connection(id):
    conn = sqlite3.connect(f'{PROJECT_DIR}/{id}/{id}.db')
    conn.row_factory = sqlite3.Row
    return conn

def setDefaultLibreListsConfig():
    os.makedirs(f"{PROJECT_DIR}/{LIBRE_LISTS_DB}")
    conn = get_db_connection(LIBRE_LISTS_DB)
    cur = conn.cursor()
    cur.executescript(f"""
        create table Preferences(KEY TEXT PRIMARY KEY NOT NULL,VALUE TEXT);
        insert into Preferences values ( 'Other_Apps_host', 'http://127.0.0.1:5000' ); 
    """)
    cur.executescript(f"""
        create table {DATABASE_CONFIG_TABLE}(KEY TEXT PRIMARY KEY NOT NULL,VALUE TEXT);
        insert into {DATABASE_CONFIG_TABLE} values ( 'display_name', 'Libre Lists database' ); 
    """)

def setDefaultDatabaseConfig(id):
    conn = get_db_connection(id)
    cur = conn.cursor()
    cur.executescript(f""" 
        create table {DATABASE_CONFIG_TABLE}( KEY TEXT PRIMARY KEY NOT NULL,VALUE TEXT);
        insert into {DATABASE_CONFIG_TABLE} values ( 'display_name', 'My Database');
        insert into {DATABASE_CONFIG_TABLE} values ( 'hidden_tables', 'sqlite_sequence,{DATABASE_CONFIG_TABLE}'); 
    """)

# ROUTES

@app.route('/')
def openfile():
    if not os.path.exists(PROJECT_DIR):
        os.makedirs(PROJECT_DIR)
    if not os.path.exists(f"{PROJECT_DIR}/{LIBRE_LISTS_DB}"):
        setDefaultLibreListsConfig()
    databases = os.listdir(PROJECT_DIR)
    return render_template("index.html", databases=sorted(databases), ver=VERSION, addons=updateAddons(), libre_lists_database=LIBRE_LISTS_DB)

@app.route('/edit/<id>')
def edit(id):
    t = request.args.get('t', default = "", type = str)
    return render_template("edit.html", id=id, ver=VERSION, addons=updateAddons(), defaultTable=t)

@app.route('/remove/<id>')
def remove(id):
    shutil.rmtree(f'{PROJECT_DIR}/{id}')
    return redirect("/", code=302)

@app.route('/create/<id>')
def create(id):
    if not os.path.exists(f"{PROJECT_DIR}/{id}"):
        os.makedirs(f"{PROJECT_DIR}/{id}")
        setDefaultDatabaseConfig(id)
    return redirect("/", code=302)

@app.route('/exec/<id>', methods=('GET', 'POST'))
def database_exec(id):
    try: 
        conn = get_db_connection(id)
        if request.method == 'POST':
            jsonRequest = request.get_json()
            queries = jsonRequest['query'].split(";")
            
            # Generate output
            for query in queries:
                output = {"header": [], "records": []}
                header = []
                result = conn.execute(query)
                try:
                    for h in range(len(result.description)):
                        headerJSON = {}
                        headerJSON["Name"] = result.description[h][0]
                        headerJSON["Type"] = ""
                        headerJSON["PK"] = 0
                        output["header"].append(headerJSON)
                    
                    for row in result.fetchall():
                        rowJSON = {}
                        for col in range(len(row)):
                            if (type(row[col]) != bytes):
                                rowJSON[result.description[col][0]] = row[col]
                        output["records"].append(rowJSON)
                except:
                    pass

            conn.commit()
        conn.close()
        return jsonify({"response": "OK", "output": output})
    except sqlite3.Error as error:
        return jsonify({"response": "Error", "why": ' '.join(error.args)})

@app.route('/json/database/<id>', methods=('GET', 'POST'))
def jsonDatabase(id):
    data = {"tables": []}
    conn = get_db_connection(id)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    for table in cursor.fetchall():
        data["tables"].append(table[0])
    conn.close()
    data["tables"] = sorted(data["tables"])
    return jsonify(data)

@app.route('/json/table/<id>/<table>', methods=('GET', 'POST'))
def jsonTable(id, table):
    records = []
    try:
        filters = request.args.get('f', type = str)
        columns = request.args.get('c', default="*", type = str)
        limit = request.args.get('limit', default=100, type=int)
        offset = request.args.get('offset', default=0, type=int)
        conn = get_db_connection(id)
        # TODO: Remplace this query with safer code
        #query = "SELECT ? FROM ? LIMIT ?,?"
        rows = conn.execute(f'SELECT {columns} FROM "{table}" {filters} LIMIT {limit} OFFSET {offset}').fetchall()
        conn.close()
        for row in rows:
            item = {}
            for column in row.keys():
                if (type(row[column]) != bytes):
                    item[column] = row[column]
                else:
                    item[column] = "[Can't display binary data]"
            records.append(item)
        return jsonify(records)
    except sqlite3.Error as error:
        return jsonify(records)

@app.route('/dialogue/<page>/<id>', methods=['GET'])
@app.route('/dialogue/<page>/<id>/<table>', methods=['GET'])
@app.route('/dialogue/<page>/<id>/<table>/<pk>', methods=['GET'])
def dialogue(page, id, table="", pk=""):
    return render_template(f"dialogues/{page}.html", id=id, ver=VERSION, addons=updateAddons(), table=table, pk=pk)

@app.route('/simplequery/<id>', methods=['POST'])
def simpleQuery(id):
    conn = get_db_connection(id)
    json = request.get_json()
    try:
        conn.execute(json["info"]["query"], json["info"]["values"])
        conn.commit()
        conn.close()
        return jsonify({"response": "OK"})
    except sqlite3.Error as error:
        conn.close()
        return jsonify({"response": "Error", "why": ' '.join(error.args)})