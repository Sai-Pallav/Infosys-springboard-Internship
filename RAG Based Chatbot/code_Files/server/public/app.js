const messagesArea = document.getElementById('messages-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const fileUpload = document.getElementById('file-upload');
const uploadStatus = document.getElementById('upload-status');
const statusText = document.getElementById('status-text');
const newChatBtn = document.getElementById('new-chat-btn');

let sessionId = localStorage.getItem('chat_session_id') || generateSessionId();
localStorage.setItem('chat_session_id', sessionId);

function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9);
}

userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if (this.value === '') this.style.height = 'auto';
});

async function sendMessage() {
    const query = userInput.value.trim();
    if (!query) return;

    userInput.value = '';
    userInput.style.height = 'auto';

    addMessage(query, 'user');

    statusText.textContent = "Thinking...";
    const loadingId = addLoadingMessage();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                sessionId: sessionId
            })
        });

        const data = await response.json();

        removeMessage(loadingId);
        statusText.textContent = "Ready";

        if (response.ok) {
            addMessage(data.answer, 'assistant', data.sources);
        } else {
            addMessage("Sorry, I encountered an error: " + (data.error || "Unknown error"), 'assistant');
        }

    } catch (error) {
        removeMessage(loadingId);
        statusText.textContent = "Error";
        addMessage("Network error. Please try again.", 'assistant');
        console.error(error);
    }
}

fileUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    uploadStatus.textContent = `Uploading ${file.name}...`;

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            uploadStatus.textContent = "Upload successful! Document ingested.";
            addMessage(`I've processed ${file.name}. You can now ask questions about it.`, 'assistant');
            setTimeout(() => uploadStatus.textContent = '', 3000);
        } else {
            uploadStatus.textContent = "Upload failed.";
            alert("Upload failed: " + data.error);
        }
    } catch (error) {
        uploadStatus.textContent = "Error during upload.";
        console.error(error);
    }
});

function addMessage(content, role, sources = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (role === 'assistant') {
        bubble.innerHTML = DOMPurify.sanitize(marked.parse(content));

        if (sources && sources.length > 0) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.className = 'sources';
            sourcesDiv.innerHTML = 'Sources: ' + sources.map(s => `<span class="source-tag">${s}</span>`).join('');
            messageDiv.appendChild(bubble);
            messageDiv.appendChild(sourcesDiv);
        } else {
            messageDiv.appendChild(bubble);
        }
    } else {
        bubble.textContent = content;
        messageDiv.appendChild(bubble);
    }

    messagesArea.appendChild(messageDiv);
    scrollToBottom();
}

function addLoadingMessage() {
    const id = 'loading-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = id;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>`;

    messageDiv.appendChild(bubble);
    messagesArea.appendChild(messageDiv);
    scrollToBottom();
    return id;
}

function removeMessage(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

newChatBtn.addEventListener('click', () => {
    sessionId = generateSessionId();
    localStorage.setItem('chat_session_id', sessionId);
    messagesArea.innerHTML = '';
    addMessage("Started a new session. How can I help?", 'assistant');
});
