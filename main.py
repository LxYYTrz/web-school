from flask import Flask,render_template, session, redirect, url_for, request

app = Flask('__main__')
app.secret_key = "abc123456789my_secret_key_2026"

@app.route('/', methods = ['GET'])
def login():
    if session.get("is_login"):
        # 已经登录，直接跳转到对应等级页面
        lv = session.get("level")
        if lv ==1:
            return redirect(url_for("level1"))
        elif lv ==2:
            return redirect(url_for("level2.html"))
        elif lv ==3:
            return redirect(url_for("level3"))
    return render_template('login.html')

# 等级1页面
@app.route('/level1', methods = ['GET'])
def level1():
    if not session.get("is_login") or session.get("level") !=1:
        return redirect(url_for("login"))
    username = session.get("username")
    return render_template('level1.html', username=username)

# 等级2页面
@app.route('/level2', methods = ['GET'])
def level2():
    if not session.get("is_login") or session.get("level") !=2:
        return redirect(url_for("login"))
    username = session.get("username")
    return render_template('level2.html', username=username)

# 等级3页面
@app.route('/level3', methods = ['GET'])
def level3():
    if not session.get("is_login") or session.get("level") !=3:
        return redirect(url_for("login"))
    username = session.get("username")
    return render_template('level3.html', username=username)

@app.route('/logout', methods=["GET"])
def logout():
    session.clear()
    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=False)
