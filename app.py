import os, io, shutil, sqlite3, json, re, base64, magic
from flask import Flask, render_template, request, jsonify, redirect, url_for, abort, send_file
from flask_cors import CORS, cross_origin
from werkzeug.exceptions import abort
from urllib.parse import unquote
from .utils import *


app = Flask(__name__)
CORS(app)
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
    databases = [d for d in os.listdir(PROJECT_DIR) if os.path.isdir(os.path.join(PROJECT_DIR, d))]
    return render_template("index.html", databases=sorted(databases), ver=VERSION, addons=updateAddons(), libre_lists_database=LIBRE_LISTS_DB)

@app.route('/edit/<id>')
def edit(id):
    config_file_path = os.path.join(PROJECT_DIR, id, "config.json")
    synchronize_json_with_db(id)
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
                        headerJSON["name"] = result.description[h][0]
                        headerJSON["type"] = ""
                        headerJSON["pk"] = 0
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

@app.route('/count/rows/<id>/<table>', methods=['GET'])
def count_rows(id, table):
    try:
        conn = get_db_connection(id)
        cursor = conn.cursor()
        cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
        row_count = cursor.fetchone()[0]
        return str(row_count)
    except Exception as e:
        return str(0)
    finally:
        cursor.close()
        conn.close()

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

        synchronize_json_with_db(id)

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
        if key not in ["pk[]"]:
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
            primary_columns = request.form.getlist('pk[]')
            where_clause = ' AND '.join(f'"{col.split(":")[0]}" = ?' for col in primary_columns)
            set_clause = ', '.join(f'"{key}" = ?' for key in form_data.keys())
            sql = f'UPDATE "{table}" SET {set_clause} WHERE {where_clause}'
            pk_values = [col.split(":")[1] for col in primary_columns]
            cursor.execute(sql, tuple(form_data.values()) + tuple(pk_values))
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

        query = f'SELECT "{column}" FROM "{table}" WHERE "{primary_key_column}" = ?'
        cursor.execute(query, (primary_key_value,))
        row = cursor.fetchone()
        conn.close()

        if row is None:
            return ""
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

@app.route('/create/table/<id>', methods=['POST'])
def create_table(id):
    table_name = request.form.get('tableName')
    column_names = request.form.getlist('columnName[]')
    column_types = request.form.getlist('columnType[]')

    if not table_name or not all(column_names) or not all(column_types):
        return jsonify({"error": "Invalid input"}), 400

    columns = []
    for name, col_type in zip(column_names, column_types):
        if col_type == "ID":
            columns.append(f'"{name}" INTEGER PRIMARY KEY')
        else:
            columns.append(f'"{name}" {col_type}')
    columns_sql = ", ".join(columns)

    sql = f'CREATE TABLE "{table_name}" ({columns_sql});'

    conn = get_db_connection(id)
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        conn.commit()
        return jsonify({"message": "Table created successfully"}), 201
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/create/column/<id>/<table>', methods=['POST'])
def create_column(id, table):
    column_name = request.form.get('column-name')
    column_description = request.form.get('column-description')
    column_type = request.form.get('column-type')
    text_max_length = request.form.get('text-max-length')
    number_min = request.form.get('number-min')
    number_max = request.form.get('number-max')
    number_decimal = request.form.get('number-decimal')
    file_types = request.form.getlist('file-types[]')
    choices = request.form.getlist('choices[]')
    allow_custom_values = request.form.get('allow-custom-values')
    date_format = request.form.get('date-format')
    required = request.form.get('required')
    unique = request.form.get('unique')
    default_value = request.form.get('default-value')
    custom_validation = request.form.get('custom-validation')
    hidden = request.form.get('hidden', 'false')
    edit = request.form.get('edit', '0')
    old_column_name = request.form.get('old-column-name', '0')

    column_config = {
        'name': column_name,
        'description': column_description,
        'required': required == 'true',
        'unique': unique == 'true',
        'hidden': hidden == 'true',
        'default_value': default_value,
        'custom_validation': custom_validation
    }

    if column_type:
        column_config["type"] = column_type

    if column_type == 'TEXT' or column_type == 'VARCHAR':
        column_config['max_length'] = text_max_length
    elif column_type == 'NUMBER':
        column_config['min'] = number_min
        column_config['max'] = number_max
        column_config['decimal'] = number_decimal == 'on'
    elif column_type == 'BLOB':
        column_config['file_types'] = file_types
    elif column_type == 'CHOICES':
        column_config['choices'] = choices
        column_config['allow_custom_values'] = allow_custom_values == 'on'
    elif column_type == 'DATETIME':
        column_config['date_format'] = date_format

    config_file_path = os.path.join(PROJECT_DIR, id, "config.json")
    if os.path.exists(config_file_path):
        with open(config_file_path, 'r') as f:
            configurations = json.load(f)
    else:
        configurations = {"tables": {}}

    if table not in configurations["tables"]:
        configurations["tables"][table] = {"columns": []}

    if edit == '1':
        for column in configurations["tables"][table]["columns"]:
            if column['name'] == old_column_name:
                rename_column(id, table, old_column_name, column_name)
                column.update(column_config)
                break
        
        with open(config_file_path, 'w') as f:
            json.dump(configurations, f, indent=4)
        return jsonify({"message": "Column edited successfully."}), 200
    else:
        configurations["tables"][table]["columns"].append(column_config)

        try:
            add_column_from_json(id, table, column_config)
            with open(config_file_path, 'w') as f:
                json.dump(configurations, f, indent=4)
            return jsonify({"message": "Column created successfully."}), 200
        except sqlite3.Error as e:
            return jsonify({"error": str(e)}), 500

@app.route('/get_table_config/<id>/<table>', methods=['GET'])
def get_table_config(id, table):
    try:
        config_file_path = os.path.join(PROJECT_DIR, id, "config.json")
        if os.path.exists(config_file_path):
            synchronize_json_with_db(id)
            with open(config_file_path, 'r') as f:
                configurations = json.load(f)

            if table in configurations["tables"]:
                return jsonify({"status": "success", "table_config": configurations["tables"][table]}), 200
            else:
                return jsonify({"status": "error", "message": "Table not found."}), 404
        else:
            return jsonify({"status": "error", "message": "Configuration file not found."}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/dialogue/<page>/<id>', methods=['GET'])
@app.route('/dialogue/<page>/<id>/<table>', methods=['GET'])
@app.route('/dialogue/<page>/<id>/<table>/<pk>', methods=['GET'])
def dialogue(page, id, table="", pk=""):
    return render_template(f"dialogues/{page}.html", id=id, ver=VERSION, addons=updateAddons(), table=table, pk=pk)
