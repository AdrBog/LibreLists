import os, io, shutil, sqlite3, json, re, base64, magic
from flask import Flask, render_template, request, jsonify, redirect, url_for, abort, send_file
from flask_cors import CORS, cross_origin
from werkzeug.exceptions import abort
from urllib.parse import unquote


app = Flask(__name__)
CORS(app)
PROJECT_DIR = os.path.join(os.path.expanduser('~'), 'LibreLists')
MIME = magic.Magic(mime=True)
CONFIG_DIR = "config"
ADDONS_FILE = "addons.json"
LIBRE_LISTS_DB = "LibreLists"
DATABASE_CONFIG_TABLE = "database_config"
TABLE_DEFAULT_CONFIG = {}
VERSION = "0.4.0"

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

@app.route('/json/table/<id>/<table>', methods=['POST'])
def jsonTable(id, table):
    records = []
    try:
        data = request.get_json()

        filters = data.get('filters', None)
        replace_blob = data.get('replace_blob', 1)
        columns = data.get('c', "*")
        items = [item.strip() for item in columns.split(',')]
        quoted_items = [f'"{item}"' if ' ' in item else item for item in items]
        columns = ', '.join(quoted_items)

        limit = data.get('limit', 100)
        offset = data.get('offset', 0)

        conn = get_db_connection(id)

        query = f'SELECT {columns} FROM "{table}"'

        if filters:
            query += f' WHERE {filters}'

        query += ' LIMIT ? OFFSET ?'

        rows = conn.execute(query, (limit, offset)).fetchall()
        conn.close()

        for row in rows:
            item = {}
            for column in row.keys():
                if isinstance(row[column], bytes):
                    mime_type = MIME.from_buffer(row[column])
                    if replace_blob == 1 and not mime_type.startswith("image/"):
                        item[column] = "#BLOB"
                    else:
                        item[column] = mime_type + "#" + base64.b64encode(row[column]).decode('utf-8')
                else:
                    item[column] = row[column]
            records.append(item)

        return jsonify(records)
    except sqlite3.Error as error:
        return jsonify({"error": str(error)}), 500


@app.route('/upload/<id>/<table>', methods=['POST'])
def upload(id, table):
    form_data = {}
    response_data = {}
    for key, value in request.form.items():
        form_data[key] = value
        response_data[key] = value
    for key, file in request.files.items():
        if file:
            form_data[key] = file.read()
            response_data[key] = base64.b64encode(file.read()).decode('utf-8')

    try:
        edit = request.args.get('edit', default='0', type=int)
        primary_key_column = request.args.get('pk_col')
        primary_key_value = request.args.get('pk_val')
        conn = get_db_connection(id)
        cursor = conn.cursor()

        if edit == 1 and primary_key_column and primary_key_value:
            set_clause = ', '.join(f'"{key}" = ?' for key in form_data.keys())
            sql = f'UPDATE "{table}" SET {set_clause} WHERE "{primary_key_column}" = ?'
            cursor.execute(sql, tuple(form_data.values()) + (primary_key_value,))
        else:
            columns = ', '.join(f'"{key}"' for key in form_data.keys())
            placeholders = ', '.join('?' for _ in form_data)
            sql = f'INSERT INTO "{table}" ({columns}) VALUES ({placeholders})'
            cursor.execute(sql, tuple(form_data.values()))

        conn.commit()
        return jsonify({"status": "success", "data": response_data}), 200
    except sqlite3.Error as error:
        return jsonify({'error': str(error)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/delete/row/<id>/<table>', methods=['POST'])
def delete_row(id, table):
    primary_key_column = request.args.get('pk_col')
    primary_key_value = request.args.get('pk_val')
    if not primary_key_column or not primary_key_value:
        return jsonify({"error": "Missing required query parameters."}), 400

    try:
        conn = get_db_connection(id)
        cursor = conn.cursor()
        sql = f'DELETE FROM "{table}" WHERE "{primary_key_column}" = ?'
        cursor.execute(sql, (primary_key_value,))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"error": "No rows deleted. Check if the ID exists."}), 404
        return jsonify({"message": "Row deleted successfully."}), 200
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/download/row/<id>/<table>', methods=['GET'])
def download_row(id, table):
    primary_key_column = request.args.get('pk_col')
    primary_key_value = request.args.get('pk_val')
    column = request.args.get('c')

    if not primary_key_column or not primary_key_value or not column:
        return jsonify({"error": "Missing required query parameters."}), 400

    try:
        conn = get_db_connection(id)
        cursor = conn.cursor()

        query = f"SELECT {column} FROM {table} WHERE {primary_key_column} = ?"
        cursor.execute(query, (primary_key_value,))
        row = cursor.fetchone()
        conn.close()

        if row is None:
            return abort(404, description="Row not found.")
        if isinstance(row[column], bytes):
            file_data = row[column]
            file_stream = io.BytesIO(file_data)
            mime_type = MIME.from_buffer(row[column])
        else:
            file_stream = io.BytesIO(str(row[column]).encode("utf-8"))
            mime_type = "text/plain"
        return send_file(file_stream, mimetype=mime_type)
    except sqlite3.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

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
