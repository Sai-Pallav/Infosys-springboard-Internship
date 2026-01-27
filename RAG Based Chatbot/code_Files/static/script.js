document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = userInput.value.trim();
        if (!query) return;
        addMessage(query, 'user-message');
        userInput.value = '';
        userInput.disabled = true;
        const loadingId = addLoadingIndicator();
        try {
            const response = await fetch('/get_response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query }),
            });
            const data = await response.json();
            removeLoadingIndicator(loadingId);
            if (data.error) {
                addMessage('Error: ' + data.error, 'bot-message');
            } else {
                addMessage(data.response, 'bot-message');
            }
        } catch (error) {
            removeLoadingIndicator(loadingId);
            addMessage('Sorry, something went wrong. Please try again.', 'bot-message');
            console.error('Error:', error);
        } finally {
            userInput.disabled = false;
            userInput.focus();
        }
    });

    function addMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', className);
        messageDiv.textContent = text;
        chatBox.appendChild(messageDiv);
        scrollToBottom();
    }

    function addLoadingIndicator() {
        const id = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = id;
        loadingDiv.classList.add('typing-indicator');
        loadingDiv.innerHTML = `
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        `;
        chatBox.appendChild(loadingDiv);
        scrollToBottom();
        return id;
    }

    function removeLoadingIndicator(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }

    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});