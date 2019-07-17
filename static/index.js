document.addEventListener('DOMContentLoaded', () => {

    // check if user already used the chat. If not - ask for name.
    if (!localStorage.getItem('name')) {
        document.querySelector('#message_to_user').innerHTML = 'Please provide the name.';

        const main_left = document.querySelector('.main-left');
        const main_mid = document.querySelector('.main-mid');
        const main_right = document.querySelector('.main-right');

        main_left.classList.remove('col-sm-2');
        main_left.style.cssFloat = 'none';
        main_left.style.textAlign = 'center';

        main_mid.style.display = 'none';
        main_mid.classList.remove('col-sm-8');

        main_right.style.display = 'none';
        main_right.classList.remove('col-sm-2');

        document.querySelector('#change_name').style.display = 'none';
    } else {
        name = localStorage.getItem('name');
        document.querySelector('#form_name').style.display = 'none';
        document.querySelector('#message_to_user').innerHTML = `Your name: ${name}`;
    };

    // disable sending messages when user didn't pick any channel yet
    if (!localStorage.getItem('current_channel')) {
        document.querySelector('#form_message').style.display = 'none';
    }

    // user provides the name
    document.querySelector('#submit_name').onclick = () => {
        const username = document.querySelector('#username').value;
        localStorage.setItem('name', username);
    };

    // user wants change a name
    document.querySelector('#change_name').onclick = () => {
        localStorage.removeItem('name');
        window.location.reload();
    };

    // manipulate availability to create a new channel
    document.querySelector('#submit_channel').disabled = true;
    document.querySelector('#channel_name').onkeyup = () => {
        if (document.querySelector('#channel_name').value.length > 0) {
            document.querySelector('#submit_channel').disabled = false;
        } else {
            document.querySelector('#submit_channel').disabled = true;
        };
    };

    // connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    socket.on('connect', () => {
        // user creates new channel
        document.querySelector('#submit_channel').onclick = () => {
            const channel_name = encodeURI(document.querySelector('#channel_name').value);
            const req = new XMLHttpRequest();
            req.open('POST', '/check_channels');

            const data = new FormData();
            data.append('channel_name', channel_name);
            req.send(data);

            req.onload = () => {
                const approval = JSON.parse(req.responseText);

                if (approval.channel_possible) {
                    socket.emit('new channel', {'channel_name': channel_name});
                } else {
                    alert('Name of the channel is already taken.');    
                };
            };
            document.querySelector('#channel_name').value = '';
            document.querySelector('#submit_channel').disabled = true;
            return false;
        };

        // user clicks a channel
        document.querySelectorAll('.btn-channel').forEach(button => {
            button.onclick = () => {
                const clicked_channel = button.dataset.name;
                localStorage.setItem('current_channel', clicked_channel);
                button.style.color = "red";
                const username = localStorage.getItem('name');
                current_channel_details = {
                    'username': encodeURI(username),
                    'channel': encodeURI(clicked_channel)
                }
                // socket.emit('save current channel', current_channel_details);
            };
        });
        
        // user sends new message
        document.querySelector('#submit_message').onclick = () => {
            const message = document.querySelector('#message').value;
            const message_details = {
                'message': encodeURI(message),
                'user': encodeURI(localStorage.getItem('name')),
                'channel': encodeURI(localStorage.getItem('current_channel'))
            };
            socket.emit('new message', message_details);
        };

        // user removes a message
        document.querySelectorAll('.msg-remove').forEach(input => {
            input.onclick = () => {
                const li_parent = input.parentElement;
                const ul = document.querySelector('#messages');

                const date = li_parent.querySelector('.msg-date').innerText;
                const user = li_parent.querySelector('.msg-user').innerText;
                const msg = li_parent.querySelector('.msg-msg').innerText;
                const channel = localStorage.getItem('current_channel');
    
                const full_message = {
                    'date': encodeURI(date),
                    'user': encodeURI(user),
                    'msg': encodeURI(msg),
                    'channel': encodeURI(channel)
                }

                socket.emit('message removed', full_message);
            }
        });
    });

    // add new channel
    socket.on('current channels', data => {
        const channel = data.new_channel;
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.setAttribute('class', 'btn btn-primary btn-channel');
        button.setAttribute('data-name', 'channel');
        button.innerHTML = `${channel}`;
        li.appendChild(button);
        document.querySelector('#channels').append(li);
    });

    // add new message
    socket.on('message added', data => {
        const channel = data.channel;
        if (localStorage.getItem('current_channel') == channel) {
            const timestamp = data.timestamp;
            const user = data.user;
            const message = data.message;

            const li = document.createElement('li');
            const span_date = document.createElement('span');
            const span_user = document.createElement('span');
            const span_message = document.createElement('span');

            span_date.setAttribute('class', 'msg-date');
            span_user.setAttribute('class', 'msg-user');
            span_message.setAttribute('class', 'msg-msg');

            span_date.innerHTML = `|${timestamp}| `;
            span_user.innerHTML = `${user}: `;
            span_message.innerHTML = `${message}`;

            li.appendChild(span_date);
            li.appendChild(span_user);
            li.appendChild(span_message);
            li.setAttribute('class', 'message-item');

            document.querySelector('#messages').append(li);
        }
    });

    // remove existing message
    socket.on('message removed', data => {
        const channel = data.channel;
        const user = data.user;
        if (localStorage.getItem('current_channel') && localStorage.getItem('name')) {
            if (localStorage.getItem('current_channel') == channel && localStorage.getItem('name') != user) {
                const date = data.date;
                const msg = data.message;
                
                const all_messages = document.querySelectorAll('.message-item');
                for (var i = 0, max=all_messages.length; i < max; i++) {
                    var message = all_messages[i];
                    li_date = message.querySelector('.msg-date').innerText;
                    li_user = message.querySelector('.msg-user').innerText;
                    li_msg = message.querySelector('.msg-msg').innerText;
                    if (li_date == date && li_user == user && li_msg == msg) {
                        var message_parent = message.parentElement;
                        message_parent.removeChild(message);
                        break;
                    }
                }
            }
        }  
    });
});
