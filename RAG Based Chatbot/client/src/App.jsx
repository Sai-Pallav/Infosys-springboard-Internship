import { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import StatusIndicator from './components/StatusIndicator';
import { Toaster } from 'react-hot-toast';
import { API_BASE } from './config';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]); // Current session messages
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('connecting'); // online, connecting, offline
  const abortControllerRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [activeDocuments, setActiveDocuments] = useState([]);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('rag_settings');
    const defaultSettings = { 
      model: 'llama-3.1-8b-instant', 
      systemPrompt: 'You are a helpful, smart, kind, and efficient AI assistant.',
      darkMode: false,
      voicePreference: 'male'
    };
    
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate from deprecated groq models
      if (parsed.model === 'llama3-8b-8192') parsed.model = 'llama-3.1-8b-instant';
      if (parsed.model === 'llama3-70b-8192') parsed.model = 'llama-3.3-70b-versatile';
      if (parsed.model === 'gemma-7b-it') parsed.model = 'gemma2-9b-it';
      return { ...defaultSettings, ...parsed };
    }
    
    return defaultSettings;
  });

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('rag_settings', JSON.stringify(newSettings));
    import('react-hot-toast').then(({ toast }) => toast.success('Settings saved successfully!'));
  };

  // Fetch sessions and documents from API on load
  useEffect(() => {
    fetchSessions();
    fetchDocuments();
  }, []);

  // Poll backend health status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Correctly derive health URL from API_BASE
        const healthUrl = API_BASE === '/api' 
          ? (window.location.hostname === 'localhost' ? 'http://localhost:3000/health' : '/health')
          : API_BASE.replace('/api', '/health');
          
        const res = await fetch(healthUrl);
        if (res.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('connecting');
        }
      } catch (e) {
        setBackendStatus('offline');
      }
    };

    checkStatus();
    
    // Poll every 5s if not online, every 30s if online
    const intervalTime = backendStatus === 'online' ? 30000 : 5000;
    const intervalId = setInterval(checkStatus, intervalTime);

    return () => clearInterval(intervalId);
  }, [backendStatus]);

  const fetchDocuments = async () => {
    try {
        const res = await fetch(`${API_BASE}/documents`);
        if (res.ok) {
            const data = await res.json();
            setDocuments(data);
            setActiveDocuments(data);
        }
    } catch (e) {
        console.error("Failed to load docs", e);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions`);
      if (res.ok) {
        const data = await res.json();
        // Map backend's 'sessionId' to the 'id' and 'title' format expected by Sidebar
        const mappedSessions = data.map(s => ({
            id: s.sessionId,
            title: s.title || `Chat ${new Date(s.lastUpdated).toLocaleString()}`,
            lastUpdated: s.lastUpdated
        }));
        setSessions(mappedSessions);
      }
    } catch (error) {
      console.error("Failed to load sessions", error);
    }
  };

  // Fetch specific session messages when selected
  useEffect(() => {
    if (!currentSessionId || currentSessionId === 'undefined') return;
    
    // Only attempt to fetch data if the backend has explicitly confirmed this session exists
    const isSavedSession = sessions.some(s => s.id === currentSessionId);
    if (!isSavedSession) return;

    // Check if we already have full messages? 
    // For simplicity, let's fetch full conversation from API
    const loadSessionData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/sessions/${currentSessionId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (e) {
            console.error("Error loading session", e);
        } finally {
            setIsLoading(false);
        }
    };

    loadSessionData();
  }, [currentSessionId]);

  const createNewSession = () => {
    // Generate the session immediately so we never fetch 'undefined'
    const newId = 'sess-' + Date.now();
    setCurrentSessionId(newId);
    setMessages([]);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const updateSessionMessages = (sessionId, newMessages) => {
     // Optimistically update UI
     setMessages(newMessages);
  };

  const abortGeneration = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
  };

  const handleSendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    
    abortControllerRef.current = new AbortController();

    try {
      // Generate a temp session ID if none exists
      let activeSessionId = currentSessionId;
      if (!activeSessionId) {
          activeSessionId = 'sess-' + Date.now();
          setCurrentSessionId(activeSessionId);
          
          // Optimistically add the new session to the sidebar
          const optTitle = text.length > 50 ? text.substring(0, 47) + '...' : text;
          const newSession = { 
            id: activeSessionId, 
            title: optTitle, 
            lastUpdated: new Date().toISOString() 
          };
          setSessions(prev => [newSession, ...prev]);
      }

      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({ 
          query: text,
          sessionId: activeSessionId,
          model: settings.model,
          systemPrompt: settings.systemPrompt,
          activeDocuments: activeDocuments
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'API request failed');
      }

      const aiMsgId = Date.now();
      const initialAiMsg = { 
        id: aiMsgId,
        role: 'assistant', 
        content: '', 
        sources: [],
        followups: []
      };
      
      setMessages(prev => [...prev, initialAiMsg]);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let aiContent = "";
      let buffer = "";
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        buffer = lines.pop() || "";
        
        for (const block of lines) {
            if (block.startsWith('data: ')) {
                try {
                    const data = JSON.parse(block.slice(6));
                    if (data.type === 'chunk') {
                        aiContent += data.text;
                        setMessages(prev => prev.map(msg => 
                            msg.id === aiMsgId ? { ...msg, content: aiContent } : msg
                        ));
                    } else if (data.type === 'metadata') {
                        setMessages(prev => prev.map(msg => 
                            msg.id === aiMsgId ? { ...msg, sources: data.sources || [], followups: data.followups || [] } : msg
                        ));
                    } else if (data.type === 'error') {
                        throw new Error(data.error);
                    }
                } catch (e) {
                    console.error("Error parsing stream data:", e);
                }
            }
        }
      }
      
      // Refresh session list to show new title/session
      fetchSessions();
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Chat error:', error);
        import('react-hot-toast').then(({ toast }) => toast.error('Connection failed'));
        const errorMsg = { role: 'assistant', content: "I'm sorry, I encountered an error connecting to the server. Please try again." };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    // Use toast from dynamic context or import directly.
    const { toast } = await import('react-hot-toast');
    const loadingToast = toast.loading('Uploading and processing document...');

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      
      toast.success('Document processed successfully!', { id: loadingToast });
      
      // Still show in chat as confirmation
      const sysMsg = { 
        role: 'assistant', 
        content: `✅ **File Uploaded Successfully:** ${file.name}\n\nI have processed the document. You can now ask questions about it.` 
      };
      
      const updatedMessages = [...messages, sysMsg];
      setMessages(updatedMessages);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload Failed: ${error.message}`, { id: loadingToast });
      const errorMsg = { role: 'assistant', content: `❌ **Upload Failed:** ${error.message}` };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      fetchDocuments(); // Refresh sidebar list
    }
  };

  const handleUrlIngestion = async (url, isDeep = false) => {
    setIsLoading(true);
    const { toast } = await import('react-hot-toast');
    const loadingToast = toast.loading('Scraping and processing URL...');

    try {
      const response = await fetch(`${API_BASE}/ingest-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, isDeep })
      });

      if (!response.ok) {
        let errorBody = {};
        try {
           errorBody = await response.json();
        } catch(e) {}
        throw new Error(errorBody.details || errorBody.error || 'URL Ingestion failed');
      }
      
      const data = await response.json();
      
      toast.success('URL processed successfully!', { id: loadingToast });

      let numPages = 1;
      try {
         if (data.details) {
            const parsed = JSON.parse(data.details);
            if (parsed.pages) numPages = parsed.pages;
         }
      } catch (e) {
         // ignore parse error 
      }
      
      const sysMsg = { 
        role: 'assistant', 
        content: `✅ **Webpage Ingested Successfully!**\n\nI have read ${numPages > 1 ? `**${numPages} pages** from` : 'the contents from'}: \`${url}\`. You can now ask me questions about it.` 
      };
      
      const updatedMessages = [...messages, sysMsg];
      setMessages(updatedMessages);

    } catch (error) {
      console.error('URL Ingestion error:', error);
      toast.error(`Ingestion Failed: ${error.message}`, { id: loadingToast });
      const errorMsg = { role: 'assistant', content: `❌ **Ingestion Failed:** ${error.message}` };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      fetchDocuments();
    }
  };

  const deleteSession = async (id) => {
    if (!id || id === 'undefined') return;

    // Optimistic UI update
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);

    if (currentSessionId === id) {
       createNewSession();
    }

    try {
        await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
    } catch (e) {
        console.error("Failed to delete session", e);
    }
  };

  return (
    <div className="flex h-screen bg-surface-light dark:bg-[#0a0a0a] overflow-hidden transition-colors duration-300">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        documents={documents}
        setDocuments={setDocuments}
        activeDocuments={activeDocuments}
        setActiveDocuments={setActiveDocuments}
        onUrlIngest={handleUrlIngestion}
        backendStatus={backendStatus}
      />

      <div className="flex-1 flex flex-col relative w-full">
        {/* Global Status Indicator (Top Right) */}
        <div className="fixed top-4 right-4 z-[60] lg:top-6 lg:right-8">
           <StatusIndicator status={backendStatus} />
        </div>

        {/* Mobile Header */}
        <header className="lg:hidden bg-white/80 dark:bg-surface-darker/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 p-4 flex items-center justify-between transition-colors z-20 shadow-sm">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all active:scale-95">
               <Menu size={24} strokeWidth={2} />
             </button>
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg text-white text-sm shadow-md shadow-emerald-500/20">✨</div>
                <span className="font-bold text-gray-800 dark:text-gray-100 tracking-tight">RAG AI</span>
             </div>
          </div>
        </header>

        <ChatWindow 
          messages={messages} 
          currentSessionId={currentSessionId}
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
          isSidebarOpen={isSidebarOpen}
          onStopGeneration={abortGeneration}
          settings={settings}
          backendStatus={backendStatus}
        />
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        currentSettings={settings}
      />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
