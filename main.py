from flask import Flask, request, jsonify, session
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app, origins=["http://10.144.11.142:5002"], supports_credentials=True)
app.secret_key = "abc123456789my_secret_key_2026"
DBserver_URL = "http://10.144.11.142:5000"

# Session Cookie配置
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False

@app.route("/api/login", methods=["POST"])
def login():
    req_data = request.get_json()
    if not req_data or "username" not in req_data or "password" not in req_data:
        return jsonify({
            "code": 400,
            "msg": "缺少username或password参数",
            "success": False
        }), 400

    username = req_data["username"]
    input_pwd = req_data["password"]

    try:
        resp = requests.post(f"{DBserver_URL}/api/get_pwd", json={"username": username}, timeout=5)
        resp.raise_for_status()
        db_result = resp.json()
        real_pwd = db_result.get("password")
        user_level = db_result.get("level")

        if real_pwd is None:
            return jsonify({
                "code": 200,
                "msg": "用户名不存在",
                "success": False
            })
        elif real_pwd == input_pwd:

            session["is_login"] = True
            session["username"] = username
            session["level"] = user_level  # 把权限等级存入session

            # 登录成功，返回username和level
            return jsonify({
                "code": 200,
                "msg": "登录成功",
                "success": True,
                "username": username,
                "level": user_level
            })
        else:
            return jsonify({
                "code": 200,
                "msg": "密码错误",
                "success": False
            })

    except requests.exceptions.RequestException as e:
        return jsonify({
            "code": 500,
            "msg": f"数据库服务调用失败: {str(e)}",
            "success": False
        }), 500

# =====================新增修改密码接口=====================
@app.route("/api/change_pwd", methods=["POST"])
def change_pwd():
    data = request.get_json()
    target_username = data.get("target_username")
    new_password = data.get("new_password")

    # 参数校验
    if not target_username or not new_password:
        return jsonify({"code":400, "msg":"参数缺失：target_username 和 new_password 必填"}),400

    # 当前登录用户信息
    current_username = session["username"]
    current_level = session["level"]

    # ==========权限判断核心逻辑==========
    # 第一步：先去dbserver查询目标用户信息（获取目标用户level）
    try:
        resp_get = requests.post(f"{DBserver_URL}/api/get_pwd", json={"username": target_username}, timeout=10)
        resp_get_data = resp_get.json()
    except Exception as e:
        return jsonify({"code":500, "msg":"调用数据库服务失败:" + str(e)}),500

    # 判断目标用户是否存在
    if resp_get_data["password"] is None:
        return jsonify({"code":404, "msg":"目标用户不存在"}),404
    target_level = resp_get_data["level"]

    # 权限规则判断
    allow_update = False
    if current_level == 1:
        # 1级：只能修改自己
        if target_username == current_username:
            allow_update = True
    elif current_level == 2:
        # 2级：修改自己 OR 目标用户是1级
        if target_username == current_username or target_level == 1:
            allow_update = True
    elif current_level == 3:
        # 3级管理员：全部允许
        allow_update = True

    if not allow_update:
        return jsonify({"code":403, "msg":"权限不足，无法修改该用户密码"}),403

    # ==========权限通过，调用dbserver执行密码更新==========
    try:
        update_resp = requests.put(f"{DBserver_URL}/api/update_pwd",
            json={
                "username": target_username,
                "new_password": new_password
            },
            timeout=10
        )
        update_result = update_resp.json()
    except Exception as e:
        return jsonify({"code":500, "msg":"调用dbserver更新密码失败:" + str(e)}),500

    # 返回dbserver结果给前端
    return jsonify(update_result)



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
