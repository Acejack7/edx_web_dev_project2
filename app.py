import os

from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channels = ['general', 'afk']

messages = {'general': [], 'afk': []}


@app.route("/")
def index():
    return render_template("index.html", channels=channels, messages=messages)


@socketio.on("new channel")
def create_channel(data):
    channel = data["channel_name"]
    channels.append(channel)
    messages[channel] = []
    emit("current channels", {'new_channel': channel}, broadcast=True)


@socketio.on("new message")
def new_message(data):
    user = data["user"]
    message = data["message"]
    channel = data["channel"]

    messages[channel].append((user, message))
    message_details = {'user': user, 'message': message, 'channel': channel}
    emit("message added", message_details, broadcast=True)


socketio.run(app, host="0.0.0.0")
