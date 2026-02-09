const messagesArea = document.getElementById('messages-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const statusText = document.getElementById('status-text');
const newChatBtn = document.getElementById('new-chat-btn');
const apiUrlInput = document.getElementById('api-url');
const saveUrlBtn = document.getElementById('save-url-btn');

// Default API URL (Fallback to localhost for dev, but configurable)
let API_BASE_URL = localStorage.getItem('api_base_url') || 'http://localhost:5000';
apiUrlInput.value = API_BASE_URL;

let sessionId = localStorage.getItem('chat_session_id') || generateSessionId();
localStorage.setItem('chat_session_id', sessionId);

function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9);
}

// Check Backend Health
async function checkBackendHealth() {
    statusText.textContent = "Connecting...";
    try {
        const res = await fetch(`${API_BASE_URL}/health`);
        if (res.ok) {
            statusText.textContent = "Ready (Online)";
            const data = await res.json();
            if (data.mongo === 'disconnected') statusText.textContent = "Ready (DB Connecting...)";
        } else {
            statusText.textContent = "Backend Error";
        }
    } catch (e) {
        statusText.textContent = "Backend Offline / Waking Up...";
    }
}
// Initial check
checkBackendHealth();

// Update API URL
saveUrlBtn.addEventListener('click', () => {
    let url = apiUrlInput.value.replace(/\/$/, ""); // Remove trailing slash
    if (!url.startsWith("http")) {
        alert("Please enter a valid URL starting with http:// or https://");
        return;
    }
    API_BASE_URL = url;
    localStorage.setItem('api_base_url', API_BASE_URL);
    alert("Backend URL Updated!");
    checkBackendHealth();
});


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

    // Start a timer to warn about Cold Start if it takes too long
    const coldStartTimer = setTimeout(() => {
        const loadingElem = document.getElementById(loadingId);
        if (loadingElem) {
            const warning = document.createElement('div');
            warning.style.fontSize = "0.8em";
            warning.style.color = "#888";
            warning.style.marginTop = "5px";
            warning.textContent = "(Server might be waking up... please wait up to 50s)";
            loadingElem.appendChild(warning);
        }
    }, 5000);

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, sessionId })
        });

        clearTimeout(coldStartTimer);

        if (response.ok) {
            const data = await response.json();
            removeMessage(loadingId);
            addMessage(data.answer, 'assistant', data.sources);
            statusText.textContent = "Ready";
        } else {
            throw new Error(`Backend returned ${response.status}`);
        }
    } catch (err) {
        clearTimeout(coldStartTimer);
        console.error("API call failed", err);
        removeMessage(loadingId);
        addMessage(`**Error:** Could not connect to backend at \`${API_BASE_URL}\`.\n\nPossible reasons:\n1. Backend is down or waking up.\n2. URL is incorrect.\n3. CORS is blocking the request.`, 'assistant');
        statusText.textContent = "Connection Failed";
    }
}

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
    // Re-add welcome message
    addMessage(`Hello! I am your AI assistant. I can answer questions using my knowledge base.\nNote: I may take up to 50 seconds to wake up if I haven't been used in a while (Free Tier).`, 'assistant');
});
