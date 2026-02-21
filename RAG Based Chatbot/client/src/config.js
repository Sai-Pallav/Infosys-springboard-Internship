// Use relative paths if we are on the same host (Monolithic Render)
// Or use the hardcoded Render backend if we are on Firebase Hosting
const isFirebase = window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com');

export const API_BASE = isFirebase
    ? 'https://rag-based-chatbot-8huy.onrender.com/api'
    : '/api';
