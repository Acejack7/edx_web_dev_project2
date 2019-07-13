import os
import urllib
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from datetime import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channels = ["general", "afk"]

messages = {'general': [("2019-07-12 23:39:07", "test", "hey!"),
                        ("2019-07-12 23:39:07", "test", "how are you?")],
            'afk': [("2019-07-12 23:39:07", "joe", "I like cookies!"),
                    ("2019-07-12 23:39:07", "dummy", "Who cares?")]}

last_channels = {}


@app.route("/")
def index():
    return render_template("index.html", channels=channels, messages=messages)


@app.route('/check_channels', methods=["POST"])
def check_channels():
    channel = urllib.parse.unquote(request.form.get("channel_name"))
    if channel in channels:
        return jsonify({"channel_possible": False})
    else:
        return jsonify({"channel_possible": True})


'''@socketio.on("save current channel")
def save_channel(data):
    user = urllib.parse.unquote(data["username"])
    channel = urllib.parse.unquote(data["channel"])
    last_channels[user] = channel'''


@socketio.on("new channel")
def create_channel(data):
    channel = urllib.parse.unquote(data["channel_name"])
    channels.append(channel)
    messages[channel] = []
    emit("current channels", {"new_channel": channel}, broadcast=True)


@socketio.on("new message")
def new_message(data):
    user = urllib.parse.unquote(data["user"])
    message = urllib.parse.unquote(data["message"])
    channel = urllib.parse.unquote(data["channel"])

    now = datetime.now()
    formatted_now = now.strftime("%Y-%m-%d %H:%M:%S")

    messages[channel].append((formatted_now, user, message))
    if len(messages) > 100:
        messages.pop(0)
    message_details = {"user": user, "message": message,
                       "channel": channel, "timestamp": formatted_now}
    emit("message added", message_details, broadcast=True)


socketio.run(app, host="0.0.0.0")
