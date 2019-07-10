document.addEventListener('DOMContentLoaded', () => {

    // connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // user provides channel name
    socket.on('connect', () => {
        document.querySelector('#submit_channel').onclick = () => {
            const channel_name = document.querySelector('#channel_name').value;
            socket.emit('new channel', {'channel_name': channel_name});
        };
    });

    // show new channel to all
    socket.on('current channels', data => {
        const channel = data.channel;
        const li = document.createElement('li');
        li.innerHTML = `New channel: ${channel}`;
        document.querySelector('#channels').append(li);
    });

    // check if user already used the chat. If not - ask for name.
    if (!localStorage.getItem('name')) {
        document.querySelector('#message_to_user').innerHTML = "Please provide the name."
    } else {
        name = localStorage.getItem('name');
        document.querySelector('#form_name').style.display = 'none';
        document.querySelector('#message_to_user').innerHTML = `Welcome ${name}!`;
    };

    // user provides his/her name
    document.querySelector('#submit_name').onclick = () => {
        const username = document.querySelector('#username').value;
        localStorage.setItem('name', username);
    };

});