const messagesArea = document.getElementById('messages-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const statusText = document.getElementById('status-text');
const newChatBtn = document.getElementById('new-chat-btn');
const apiUrlInput = document.getElementById('api-url');
const saveUrlBtn = document.getElementById('save-url-btn');
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.querySelector('.sidebar');

if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// Default Render Backend URL
// Default to relative path for same-origin deployment (Render)
const RENDER_BACKEND_URL = '';

let API_BASE_URL = localStorage.getItem('api_base_url');

// If we are on localhost, default to localhost:5000. 
// If on production (Render), default to relative path (empty string)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (!API_BASE_URL || (!isLocal && API_BASE_URL.includes('localhost')) || API_BASE_URL.includes('rag-backend-hybrid')) {
    API_BASE_URL = isLocal ? 'http://localhost:5000' : RENDER_BACKEND_URL;
    localStorage.setItem('api_base_url', API_BASE_URL);
}

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

    // Character Count Logic
    const charCount = this.value.length;
    const charCountElem = document.getElementById('char-count');
    if (charCountElem) {
        charCountElem.textContent = `${charCount} / 2000`;
        if (charCount > 2000) {
            charCountElem.style.color = 'red';
            sendBtn.disabled = true;
        } else {
            charCountElem.style.color = '#888';
            sendBtn.disabled = false;
        }
    }
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
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, sessionId })
        });

        if (response.ok) {
            const data = await response.json();
            removeMessage(loadingId);
            addMessage(data.answer, 'assistant', data.sources);
            statusText.textContent = "Ready";
        } else {
            throw new Error(`Backend returned ${response.status}`);
        }
    } catch (err) {
        console.error("API call failed", err);
        removeMessage(loadingId);
        addMessage(`**Error:** Could not connect to backend at \`${API_BASE_URL}\`.\n\nPossible reasons:\n1. Backend is down or waking up.\n2. URL is incorrect.\n3. CORS is blocking the request.`, 'assistant');
        statusText.textContent = "Connection Failed";
    }
}

function addMessage(content, role, sources = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (role === 'assistant') {
        bubble.innerHTML = DOMPurify.sanitize(marked.parse(content));
        contentDiv.appendChild(bubble);

        if (sources && sources.length > 0) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.className = 'sources';
            sourcesDiv.innerHTML = 'Sources: ' + sources.map(s => `<span class="source-tag">${s}</span>`).join('');
            contentDiv.appendChild(sourcesDiv);
        }
    } else {
        bubble.textContent = content;
        contentDiv.appendChild(bubble);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    messagesArea.appendChild(messageDiv);
    scrollToBottom();
}

function addLoadingMessage() {
    const id = 'loading-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = id;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = '🤖';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>`;

    contentDiv.appendChild(bubble);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

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

// --- File Upload Logic ---
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');

if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const statusContainer = document.getElementById('upload-status-container');

        // Show uploading status
        const originalPlaceholder = userInput.placeholder;
        userInput.placeholder = "Uploading and processing file...";
        userInput.disabled = true;
        uploadBtn.disabled = true;

        statusContainer.className = 'upload-status-container uploading';
        statusContainer.innerHTML = `<div class="spinner"></div> <span>Processing "${file.name}"...</span>`;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || 'Upload failed');
            }

            // Success UI
            statusContainer.className = 'upload-status-container success';
            statusContainer.innerHTML = `✅ <span>"${file.name}" ready for chat.</span>`;

            addMessage(`File "${file.name}" uploaded and processed successfully.`, 'assistant');

            // Auto-hide success after 5 seconds
            setTimeout(() => {
                if (statusContainer.className.includes('success')) {
                    statusContainer.innerHTML = '';
                    statusContainer.className = 'upload-status-container';
                }
            }, 5000);

        } catch (error) {
            console.error('Error uploading file:', error);
            // Error UI
            statusContainer.className = 'upload-status-container error';
            statusContainer.innerHTML = `❌ <span>Failed: ${error.message}</span>`;

            alert(`Error uploading file: ${error.message}`);
        } finally {
            // Reset UI
            fileInput.value = ''; // Clear input
            userInput.placeholder = originalPlaceholder;
            userInput.disabled = false;
            uploadBtn.disabled = false;
        }
    });
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
    addMessage(`Greetings! ✨ I'm your Personal Knowledge Assistant. \n\nI've analyzed your documents and I'm ready to help you find answers, summarize content, or brainstorm ideas based on your data. What's on your mind today?`, 'assistant');
});
