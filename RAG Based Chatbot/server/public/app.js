import { auth, db, isDemoMode, groqApiKey } from './firebase-config.js';
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

    // If we are NOT in demo mode, try the backend first (supports RAG)
    if (!isDemoMode) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, sessionId })
            });

            if (response.ok) {
                const data = await response.json();
                removeMessage(loadingId);
                addMessage(data.answer, 'assistant', data.sources);
                statusText.textContent = "Ready";
                return;
            } else {
                throw new Error(`Backend returned ${response.status}`);
            }
        } catch (err) {
            console.warn("Backend API call failed, falling back to direct AI...", err);
        }
    }

    // Fallback: Direct Groq (Cloud Mode) or Demo Response
    if (groqApiKey) {
        try {
            await callGroqDirectly(query, loadingId);
            return;
        } catch (err) {
            console.error("Direct Groq call failed:", err);
            handleDemoResponse(query, loadingId);
            return;
        }
    }

    // Final Fallback: Demo Mode
    handleDemoResponse(query, loadingId);
}


async function callGroqDirectly(query, loadingId) {
    const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    const body = {
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: "You are a helpful and factual RAG Assistant. (Note: In this cloud demo, document retrieval is simulated. Answer generally but helpfully.)"
            },
            {
                role: "user",
                content: query
            }
        ],
        temperature: 0.7
    };

    const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Groq API Error: ${response.statusText} ${JSON.stringify(errData)}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    removeMessage(loadingId);
    addMessage(answer, 'assistant');
    statusText.textContent = "Ready";
}

function handleDemoResponse(query, loadingId, error = null) {
    if (loadingId) removeMessage(loadingId);
    statusText.textContent = "Demo Mode";
    if (error) console.warn("API Request Failed, switching to mock response:", error);

    // Mock Response for Demo
    setTimeout(() => {
        addMessage(
            "I am currently running in **Frontend Demo Mode** because the backend server is not deployed (hosting is static only).\n\n" +
            "I cannot process your request: _\"" + query + "\"_ drastically, but the UI is fully functional!",
            'assistant'
        );
    }, 500);
}

fileUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    uploadStatus.textContent = `Uploading ${file.name}...`;

    if (isDemoMode) {
        handleDemoUpload(file);
        return;
    }

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
            throw new Error("Backend unavailable (Demo Mode active)");
        }

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
        handleDemoUpload(file, error);
    }
});

function handleDemoUpload(file, error = null) {
    if (error) console.warn("Upload Failed, switching to mock response:", error);
    uploadStatus.textContent = "Demo Mode: Upload simulated.";
    setTimeout(() => {
        addMessage(`(Demo) I pretended to process ${file.name}. In the full version, I would index this file.`, 'assistant');
        uploadStatus.textContent = '';
    }, 1500);
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
    addMessage("Started a new session. How can I help?", 'assistant');
});
