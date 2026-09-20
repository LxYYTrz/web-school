import os

from flask import Flask, send_from_directory, session

app = Flask(__name__, static_folder="static", static_url_path="")

_secret_key = os.environ.get("SECRET_KEY")
if not _secret_key:
    raise RuntimeError("SECRET_KEY environment variable must be set")
app.secret_key = _secret_key

app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False


@app.route("/", methods=["GET"])
def root():
    if session.get("is_login"):
        return send_from_directory("static", "index.html")
    return send_from_directory("static", "login.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=False)
