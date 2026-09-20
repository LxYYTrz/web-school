import os

import requests
from flask import Flask, jsonify, request, session
from flask_cors import CORS

app = Flask(__name__)
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://10.144.11.142:5002")
CORS(app, origins=[
    FRONTEND_ORIGIN,
    "http://localhost:5002",
    "http://127.0.0.1:5002",
], supports_credentials=True)
app.secret_key = os.environ.get("SECRET_KEY", "abc123456789my_secret_key_2026")
DBSERVER_URL = os.environ.get("DBSERVER_URL", "http://10.144.11.142:5000")

app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False


def db_call(method, path, **kwargs):
    resp = requests.request(method, f"{DBSERVER_URL}{path}", timeout=10, **kwargs)
    resp.raise_for_status()
    return resp.json()


def get_login_user():
    """返回 (username, level)，未登录返回 None"""
    username = session.get("username")
    if not username:
        return None
    return username, session.get("level")


def can_change_pwd(current_level, current_username, target_username, target_level):
    if current_level == 3:
        return True
    if current_level == 2:
        return target_username == current_username or target_level == 1
    return target_username == current_username


def visible_users(current_level, current_username, all_users):
    if current_level == 3:
        return all_users
    if current_level == 2:
        return [u for u in all_users if u["level"] == 1 or u["username"] == current_username]
    return [u for u in all_users if u["username"] == current_username]


@app.route("/api/login", methods=["POST"])
def login():
    req_data = request.get_json(silent=True)
    if not req_data or "username" not in req_data or "password" not in req_data:
        return jsonify({"code": 400, "msg": "缺少username或password参数", "success": False}), 400

    username = req_data["username"]
    input_pwd = req_data["password"]

    try:
        db_result = db_call("POST", "/api/get_pwd", json={"username": username})
    except requests.exceptions.RequestException as e:
        return jsonify({"code": 500, "msg": f"数据库服务调用失败: {str(e)}", "success": False}), 500

    real_pwd = db_result.get("password")
    user_level = db_result.get("level")

    if real_pwd is None:
        return jsonify({"code": 200, "msg": "用户名不存在", "success": False})
    if real_pwd != input_pwd:
        return jsonify({"code": 200, "msg": "密码错误", "success": False})

    session["is_login"] = True
    session["username"] = username
    session["level"] = user_level
    return jsonify({
        "code": 200,
        "msg": "登录成功",
        "success": True,
        "username": username,
        "level": user_level,
    })


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"code": 200, "msg": "已退出登录"})


@app.route("/api/me", methods=["GET"])
def me():
    user = get_login_user()
    if not user:
        return jsonify({"code": 401, "msg": "未登录"}), 401
    return jsonify({"code": 200, "username": user[0], "level": user[1]})


@app.route("/api/change_pwd", methods=["POST"])
def change_pwd():
    user = get_login_user()
    if not user:
        return jsonify({"code": 401, "msg": "未登录"}), 401
    current_username, current_level = user

    data = request.get_json(silent=True) or {}
    target_username = data.get("target_username")
    new_password = data.get("new_password")
    if not target_username or not new_password:
        return jsonify({"code": 400, "msg": "参数缺失：target_username 和 new_password 必填"}), 400

    try:
        target_info = db_call("POST", "/api/get_pwd", json={"username": target_username})
    except Exception as e:
        return jsonify({"code": 500, "msg": "调用数据库服务失败:" + str(e)}), 500

    if target_info["password"] is None:
        return jsonify({"code": 404, "msg": "目标用户不存在"}), 404

    if not can_change_pwd(current_level, current_username, target_username, target_info["level"]):
        return jsonify({"code": 403, "msg": "权限不足，无法修改该用户密码"}), 403

    try:
        return jsonify(db_call("PUT", "/api/update_user", json={
            "username": target_username,
            "new_password": new_password,
        }))
    except Exception as e:
        return jsonify({"code": 500, "msg": "调用dbserver更新密码失败:" + str(e)}), 500


@app.route("/api/add_user", methods=["POST"])
def add_user():
    user = get_login_user()
    if not user:
        return jsonify({"code": 401, "msg": "未登录"}), 401
    if user[1] != 3:
        return jsonify({"code": 403, "msg": "权限不足，仅管理员可创建用户"}), 403

    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")
    level = data.get("level", 1)

    if not username or not password:
        return jsonify({"code": 400, "msg": "参数缺失：username 和 password 必填"}), 400
    if level not in (1, 2, 3):
        return jsonify({"code": 400, "msg": "level必须是1、2或3"}), 400

    try:
        result = db_call("POST", "/api/insert_user", json={
            "username": username,
            "password": password,
            "level": level,
        })
    except Exception as e:
        return jsonify({"code": 500, "msg": "调用dbserver创建用户失败:" + str(e)}), 500
    return jsonify(result), (200 if result.get("code") == 200 else result.get("code", 500))


@app.route("/api/users", methods=["GET"])
def list_users():
    user = get_login_user()
    if not user:
        return jsonify({"code": 401, "msg": "未登录"}), 401
    current_username, current_level = user

    try:
        result = db_call("GET", "/api/list_users")
    except Exception as e:
        return jsonify({"code": 500, "msg": "调用数据库服务失败:" + str(e)}), 500

    users = visible_users(current_level, current_username, result.get("users", []))
    return jsonify({"code": 200, "users": users})


@app.route("/api/users/<username>", methods=["PUT"])
def edit_user(username):
    user = get_login_user()
    if not user:
        return jsonify({"code": 401, "msg": "未登录"}), 401
    current_username, current_level = user

    data = request.get_json(silent=True) or {}
    new_password = data.get("new_password")
    new_level = data.get("new_level")
    if new_password is None and new_level is None:
        return jsonify({"code": 400, "msg": "new_password和new_level至少提供一个"}), 400

    try:
        target_info = db_call("POST", "/api/get_pwd", json={"username": username})
    except Exception as e:
        return jsonify({"code": 500, "msg": "调用数据库服务失败:" + str(e)}), 500

    if target_info["password"] is None:
        return jsonify({"code": 404, "msg": "目标用户不存在"}), 404

    if new_level is not None:
        if current_level != 3:
            return jsonify({"code": 403, "msg": "权限不足，仅管理员可修改用户等级"}), 403

    if new_password is not None:
        if not can_change_pwd(current_level, current_username, username, target_info["level"]):
            return jsonify({"code": 403, "msg": "权限不足，无法修改该用户密码"}), 403

    payload = {"username": username}
    if new_password is not None:
        payload["new_password"] = new_password
    if new_level is not None:
        payload["new_level"] = new_level

    try:
        return jsonify(db_call("PUT", "/api/update_user", json=payload))
    except Exception as e:
        return jsonify({"code": 500, "msg": "调用dbserver更新失败:" + str(e)}), 500


@app.route("/api/users/<username>", methods=["DELETE"])
def remove_user(username):
    user = get_login_user()
    if not user:
        return jsonify({"code": 401, "msg": "未登录"}), 401
    if user[1] != 3:
        return jsonify({"code": 403, "msg": "权限不足，仅管理员可删除用户"}), 403
    if username == user[0]:
        return jsonify({"code": 400, "msg": "不能删除自己的账号"}), 400

    try:
        return jsonify(db_call("DELETE", "/api/delete_user", json={"username": username}))
    except Exception as e:
        return jsonify({"code": 500, "msg": "调用dbserver删除失败:" + str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
