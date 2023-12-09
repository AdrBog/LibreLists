import os, shutil, sqlite3, json, re
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_cors import CORS, cross_origin
from werkzeug.exceptions import abort


app = Flask(__name__)
CORS(app)
PROJECT_DIR = "projects"
CONFIG_DIR = "config"
CONFIG_FILE = "config.json"
ADDONS_FILE = "addons.json"
TABLE_CONFIG_FILE = "tables.json"
INFO_FILE = "info.json"
TABLE_DEFAULT_CONFIG = {}
VERSION = "0.2.1"

# FUNCTIONS

def updateAddons():
    with open(f"{CONFIG_DIR}/{ADDONS_FILE}") as f:
        return json.load(f)

def get_db_connection(id):
    conn = sqlite3.connect(f'{PROJECT_DIR}/{id}/{id}.db')
    conn.row_factory = sqlite3.Row
    return conn

# ROUTES

@app.route('/')
def openfile():
    if not os.path.exists(PROJECT_DIR):
        os.makedirs(PROJECT_DIR)
    databases = os.listdir(PROJECT_DIR)
    return render_template("index.html", databases=databases, ver=VERSION, addons=updateAddons())

@app.route('/edit/<id>')
def edit(id):
    return render_template("edit.html", id=id, ver=VERSION, addons=updateAddons())

@app.route('/remove/<id>')
def remove(id):
    shutil.rmtree(f'{PROJECT_DIR}/{id}')
    return redirect("/", code=302)

@app.route('/create/<id>')
def create(id):
    if not os.path.exists(f"{PROJECT_DIR}/{id}"):
        os.makedirs(f"{PROJECT_DIR}/{id}")
        shutil.copyfile(f"{CONFIG_DIR}/{INFO_FILE}", f"{PROJECT_DIR}/{id}/{INFO_FILE}")
        shutil.copyfile(f"{CONFIG_DIR}/{TABLE_CONFIG_FILE}", f"{PROJECT_DIR}/{id}/{TABLE_CONFIG_FILE}")
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
    data = {"metadata" : {}, "tables": []}

    with open(f"{PROJECT_DIR}/{id}/{INFO_FILE}") as f:
        info = json.load(f)
    
    for infoName in info:
        data["metadata"].update({infoName : info[infoName]})

    conn = get_db_connection(id)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    for table in cursor.fetchall():
        if table[0] not in data["metadata"]["hidden_tables"]:
            data["tables"].append(table[0])
    conn.close()
    return jsonify(data)

@app.route('/json/table/<id>/<table>', methods=('GET', 'POST'))
def jsonTable(id, table):
    records = []
    try:
        filters = request.args.get('f', type = str)
        conn = get_db_connection(id)
        rows = conn.execute(f'SELECT * FROM {table} {filters}').fetchall()
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

@app.route('/json/config', methods=('GET', 'POST'))
def jsonConfig():
    with open(f"{CONFIG_DIR}/{CONFIG_FILE}") as f:
        return jsonify(json.load(f))

@app.route('/update', methods=['POST'])
def update():
    jsonRequest = request.get_json()
    if jsonRequest["context"] == "DB_METADATA":
        with open(f"{PROJECT_DIR}/{jsonRequest['database']}/{INFO_FILE}", "r+") as f:
            data = json.load(f)
            for config in jsonRequest["data"]:
                data[config] = jsonRequest["data"][config]
            f.seek(0)
            json.dump(data, f)
            f.truncate()
    elif jsonRequest["context"] == "LL_CONFIG":
        with open(f"{CONFIG_DIR}/{CONFIG_FILE}", "r+") as f:
            data = json.load(f)
            for config in jsonRequest["data"]:
                data[config] = jsonRequest["data"][config]
            f.seek(0)
            json.dump(data, f)
            f.truncate()
    return {"response": "OK"}

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