$(document).ready(function() {

    $('#chat-form').submit(function(event) {
        event.preventDefault();
        var userMessage = $('#user-input').val();

        displayMessage('user', userMessage);
        $('#user-input').val('');

        $.ajax({
            url: '/api/chat',
            type: 'POST',
            data: { user_message: userMessage },
            success: function(response) {

                displayMessage('bot', response.bot_response);
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    // Function to display messages in the chat box
    function displayMessage(sender, message) {
        var messageClass = (sender === 'user')? 'user-message' : 'bot-response';
        var messageElement = $('<li>', { class: messageClass, html: marked.parse(message) });
        $('#chat-box').append(messageElement);
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
    }

    // Function to handle new session button click
    $('#new-session-btn').click(function() {
        var confirmedNewSession = confirm('Are you sure you want to start a new session? ');
        if (confirmedNewSession) {
            $.ajax({
                url: '/start-new-session',
                type: 'POST',
                data: { previous_session_id: '{{ session.get("session_id") }}' },
                success: function(response) {
                    $('#chat-box').empty();
                },
                error: function(error) {
                    console.log(error);
                }
            });
        }
    });

    // Function to handle view history button click
    $('#view-history-btn').click(function() {
        $.ajax({
            url: '/chat-history',
            type: 'GET',
            success: function(data) {
                $('#chat-sessions').empty();
        
                const sessionGroups = {};
                for (const entry of data.chat_history) {
                    const sessionId = entry.session_id;
                    if (!sessionGroups[sessionId]) {
                        sessionGroups[sessionId] = [];
                    }
                    sessionGroups[sessionId].push(entry);
                }
            
                for (const sessionId in sessionGroups) {
                    const sessionContainer = $('<div>', { class: 'chat-session' });
                    const sessionHeader = $('<h3>', { text: `Session ID: ${sessionId}` });
                    sessionContainer.append(sessionHeader);
            
        
                    for (const entry of sessionGroups[sessionId]) {
                        const messageClass = entry.message.startsWith('Human:') ? 'user-message' : 'bot-response';
                        const messageText = entry.message.split(': ')[1];
                        const messageElement = $('<li>', { class: messageClass, text: messageText });
                        sessionContainer.append(messageElement);
                    }
            
                    $('#chat-sessions').append(sessionContainer);
                }
            
                $('.chat-session').click(function() {
                    const sessionId = $(this).find('h3').text().split(':')[1].trim();
                    resumeSession(sessionId);
                });
            
                $('#chat-history-modal').show();
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    $('.close-btn').click(function() {
        $('#chat-history-modal').hide();
    });

    $(window).click(function(event) {
        if ($(event.target).parents('#chat-history-modal').length === 0) {
            $('#chat-history-modal').hide();
        }
    });

    function resumeSession(sessionId) {
        $('#chat-box').empty();
    
        $.ajax({
            url: '/get-conversation-history',
            type: 'POST',
            data: { session_id: sessionId },
            success: function(data) {
                for (const message of data.conversation_history) {
                    const messageClass = message.startsWith('Human:') ? 'user-message' : 'bot-response';
                    const messageElement = $('<li>', { class: messageClass, html: marked.parse(message.substr(7)) });
                    $('#chat-box').append(messageElement);
                }
    
                $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);

                $('#chat-history-modal').hide();
            },
            error: function(error) {
                console.log(error);
            }
        });
    }

});