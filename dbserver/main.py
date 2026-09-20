import os

import pymysql
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "203.195.204.32"),
    "port": int(os.environ.get("DB_PORT", "3306")),
    "user": os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASSWORD", "AA&&sziit2026"),
    "database": os.environ.get("DB_NAME", "team3"),
    "charset": "utf8mb4",
}


def db_query(sql, args=()):
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(sql, args)
            return cursor.fetchall()
    finally:
        conn.close()


def db_execute(sql, args=()):
    """执行写操作，返回影响行数"""
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            rows = cursor.execute(sql, args)
        conn.commit()
        return rows
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@app.route("/api/get_pwd", methods=["POST"])
def get_pwd():
    req_data = request.get_json(silent=True)
    if not req_data or "username" not in req_data:
        return jsonify({"code": 400, "msg": "缺少username参数", "password": None, "level": None}), 400

    try:
        rows = db_query(
            "SELECT password, level FROM users WHERE username=%s LIMIT 1",
            (req_data["username"],),
        )
    except Exception as e:
        print("=====数据库接口异常=====")
        print(repr(e))
        return jsonify({"code": 500, "msg": str(e), "password": None, "level": None}), 500

    if rows:
        return jsonify({"code": 200, "msg": "查询成功", "password": rows[0]["password"], "level": rows[0]["level"]})
    return jsonify({"code": 200, "msg": "用户名不存在", "password": None, "level": None})


@app.route("/api/list_users", methods=["GET"])
def list_users():
    try:
        rows = db_query("SELECT username, level FROM users ORDER BY level DESC, username")
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)}), 500
    return jsonify({"code": 200, "msg": "查询成功", "users": rows})


@app.route("/api/insert_user", methods=["POST"])
def insert_user():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")
    level = data.get("level", 1)

    if not username or not password:
        return jsonify({"code": 400, "msg": "缺少username或password参数"}), 400
    if level not in (1, 2, 3):
        return jsonify({"code": 400, "msg": "level必须是1、2或3"}), 400

    try:
        exists = db_query("SELECT 1 FROM users WHERE username=%s LIMIT 1", (username,))
        if exists:
            return jsonify({"code": 409, "msg": "用户名已存在"}), 409
        rows = db_execute(
            "INSERT INTO users (username, password, level) VALUES (%s, %s, %s)",
            (username, password, level),
        )
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)}), 500

    if rows > 0:
        return jsonify({"code": 200, "msg": "用户创建成功"})
    return jsonify({"code": 500, "msg": "创建失败"}), 500


@app.route("/api/update_user", methods=["PUT"])
def update_user():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    new_password = data.get("new_password")
    new_level = data.get("new_level")

    if not username:
        return jsonify({"code": 400, "msg": "缺少username参数"}), 400
    if new_password is None and new_level is None:
        return jsonify({"code": 400, "msg": "new_password和new_level至少提供一个"}), 400
    if new_level is not None and new_level not in (1, 2, 3):
        return jsonify({"code": 400, "msg": "new_level必须是1、2或3"}), 400

    sets, args = [], []
    if new_password is not None:
        sets.append("password=%s")
        args.append(new_password)
    if new_level is not None:
        sets.append("level=%s")
        args.append(new_level)
    args.append(username)

    try:
        rows = db_execute(f"UPDATE users SET {', '.join(sets)} WHERE username=%s", tuple(args))
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)}), 500

    if rows > 0:
        return jsonify({"code": 200, "msg": "更新成功"})
    return jsonify({"code": 404, "msg": "用户名不存在"}), 404


@app.route("/api/delete_user", methods=["DELETE"])
def delete_user():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    if not username:
        return jsonify({"code": 400, "msg": "缺少username参数"}), 400

    try:
        rows = db_execute("DELETE FROM users WHERE username=%s", (username,))
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)}), 500

    if rows > 0:
        return jsonify({"code": 200, "msg": "删除成功"})
    return jsonify({"code": 404, "msg": "用户名不存在"}), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
