from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    "host": "203.195.204.32",
    "port": 3306,
    "user": "root",
    "password": "AA&&sziit2026",
    "database": "team3",
    "charset": "utf8mb4"
}

@app.route("/api/get_pwd", methods=["POST"])
def get_pwd():
    req_data = request.get_json()
    if not req_data or "username" not in req_data:
        return jsonify({"code": 400, "msg": "缺少username参数", "password": None, "level": None}), 400

    username = req_data["username"]
    conn = None
    cursor = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        # 同时查询password 和 level
        sql = "SELECT password, level FROM users WHERE username=%s LIMIT 1"
        cursor.execute(sql, (username,))
        row = cursor.fetchone()
        if row:
            return jsonify({
                "code": 200,
                "msg": "查询成功",
                "password": row["password"],
                "level": row["level"]
            })
        else:
            return jsonify({
                "code": 200,
                "msg": "用户名不存在",
                "password": None,
                "level": None
            })
    except Exception as e:
        print("=====数据库接口异常=====")
        print(repr(e))
        return jsonify({"code": 500, "msg": str(e), "password": None, "level": None}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ==========修改密码接口==========
@app.route("/api/update_pwd", methods=["PUT"])
def update_pwd():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        username = data.get("username")
        new_password = data.get("new_password")

        # 参数校验
        if not username or not new_password:
            return jsonify({"code":400,"msg":"缺少username或new_password参数"}),400

        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        # 更新语句
        sql = "UPDATE users SET password=%s WHERE username=%s"
        affect_rows = cursor.execute(sql, (new_password, username))
        conn.commit()

        # affect_rows：影响行数，0=没有这个用户
        if affect_rows > 0:
            return jsonify({"code":200,"msg":"密码修改成功"})
        else:
            return jsonify({"code":404,"msg":"用户名不存在"})

    except Exception as e:
        if conn:
            conn.rollback() #出错回滚
        return jsonify({"code":500,"msg":str(e)}),500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
