document.addEventListener('DOMContentLoaded', () => {

    // check if user already used the chat. If not - ask for name.
    if (!localStorage.getItem('name')) {
        document.querySelector('#message_to_user').innerHTML = "Please provide the name."
    } else {
        name = localStorage.getItem('name');
        document.querySelector('#form_name').style.display = 'none';
        document.querySelector('#message_to_user').innerHTML = `Your name: ${name}`;
    };

    // user provides the name
    document.querySelector('#submit_name').onclick = () => {
        const username = document.querySelector('#username').value;
        localStorage.setItem('name', username);
    };

    // connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    socket.on('connect', () => {
        // user provides channel name
        document.querySelector('#submit_channel').onclick = () => {
            const channel_name = document.querySelector('#channel_name').value;
            socket.emit('new channel', {'channel_name': channel_name});
        };

        // user sends new message
        document.querySelector('#submit_message').onclick = () => {
            const message = document.querySelector('#message').value;
            const message_details = {
                'message': message,
                'user': localStorage.getItem('name'),
                'channel': localStorage.getItem('current_channel')
            };
            socket.emit('new message', message_details);
        };

        // user clicks a channel
        document.querySelectorAll('.btn-channel').forEach(button => {
            button.onclick = () => {
                const clicked_channel = button.dataset.name;
                localStorage.setItem('current_channel', clicked_channel);
                const username = localStorage.getItem('name');
                current_channel_details = {
                    'username': username,
                    'channel': clicked_channel
                }
                socket.emit('save current channel', current_channel_details);
            };
        });
    });

    // show new channel to all
    socket.on('current channels', data => {
        const channel = data.new_channel;
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.setAttribute('class', 'btn btn-primary btn-channel');
        button.setAttribute('name', 'channel');
        button.innerHTML = `${channel}`;
        li.appendChild(button);
        document.querySelector('#channels').append(li);
    });

    // show new message to all
    socket.on('message added', data => {
        const timestamp = data.timestamp;
        const user = data.user;
        const message = data.message;
        const li = document.createElement('li');
        li.innerHTML = `${timestamp} | ${user}: ${message}`;
        document.querySelector('#messages').append(li);
    });

    // check if current channel exists; if not - pick general
    if (!localStorage.getItem('current_channel')) {
        localStorage.setItem('current_channel', 'general');
        current_channel = localStorage.getItem('current_channel');
    };
    
    // set the color for current channel
    current_channel = localStorage.getItem('current_channel');
    document.querySelectorAll('.btn-channel').forEach(button => {
        const button_channel = button.dataset.name;
        if (button_channel == current_channel) {
            button.style.color = "red";
            console.log(button);
        };
    });
});