import os
import urllib
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from datetime import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channels = ["general", "afk"]

messages = {'general': [("2019-07-12 23:39", "test", "hey!"),
                        ("2019-07-12 23:39", "test", "how are you?")],
            'afk': [("2019-07-12 23:39", "joe", "I like cookies!"),
                    ("2019-07-12 23:39", "dummy", "Who cares?")]}

last_channels = {}


@app.route("/")
def index():
    return render_template("index.html", channels=channels, messages=messages)

# check if new channel's name is available
@app.route('/check_channels', methods=["POST"])
def check_channels():
    channel = urllib.parse.unquote(request.form.get("channel_name"))
    if channel in channels:
        return jsonify({"channel_possible": False})
    else:
        return jsonify({"channel_possible": True})

# create a new channel, tell all users about that
@socketio.on("new channel")
def create_channel(data):
    channel = urllib.parse.unquote(data["channel_name"])
    channels.append(channel)
    messages[channel] = []
    emit("current channels", {"new_channel": channel}, broadcast=True)

# add new message, tell all users about that
@socketio.on("new message")
def new_message(data):
    user = urllib.parse.unquote(data["user"])
    message = urllib.parse.unquote(data["message"])
    channel = urllib.parse.unquote(data["channel"])

    now = datetime.now()
    formatted_now = now.strftime("%Y-%m-%d %H:%M")

    messages[channel].append((formatted_now, user, message))
    if len(messages) > 100:
        messages.pop(0)
    message_details = {"user": user, "message": message,
                       "channel": channel, "timestamp": formatted_now}
    emit("message added", message_details, broadcast=True)

# remove message, tell all users about that
@socketio.on("message removed")
def remove_message(data):
    date = urllib.parse.unquote(data["date"])
    date_updated = date.strip('|')
    date_updated = date.strip('| ')

    user = urllib.parse.unquote(data["user"])
    user_updated = user[:-2]

    msg = urllib.parse.unquote(data["msg"])
    channel = urllib.parse.unquote(data["channel"])

    all_current_messages = messages[channel]

    for message in all_current_messages:
        msg_date = message[0]
        msg_user = message[1]
        msg_text = message[2]
        print('tu')
        if msg_date == date_updated and msg_user == user_updated and msg_text == msg:
            all_current_messages.remove(message)
            break

    removed_message = {"date": date, "user": user,
                       "message": msg, "channel": channel}

    emit("message removed", removed_message, broadcast=True)


socketio.run(app, host="0.0.0.0")
