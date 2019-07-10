import os

from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channels = ['general']


@app.route("/")
def index():
    return render_template("index.html", channels=channels)


@socketio.on("new channel")
def vote(data):
    channel = data["channel_name"]
    channels.append(channel)
    emit("current channels", {'new_channel': channel}, broadcast=True)


socketio.run(app, host="127.0.0.121")
