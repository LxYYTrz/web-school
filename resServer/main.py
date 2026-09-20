from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="static", static_url_path="")


@app.route("/")
def root():
    return send_from_directory("static", "login.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=False)
