import { useState, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { Bot, Loader2, GitFork, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../config';

export default function SharedChatView() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Extract ID from URL path (e.g., /share/sess-12345)
    const segments = window.location.pathname.split('/');
    const sessionId = segments[segments.length - 1];

    if (!sessionId) {
      setError("No session ID provided.");
      setIsLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const response = await fetch(`${API_BASE}/public/sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error('Chat session not found or is private.');
        }
        const data = await response.json();
        setSession(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 text-center px-4">
        <Bot size={48} className="text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Snapshot Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          {error || "We couldn't locate this shared conversation. The link may be invalid or the chat has been deleted."}
        </p>
      </div>
    );
  }

  const handleFork = async () => {
    setIsLoading(true);
    try {
      const newSessionId = 'sess-' + Date.now();
      const response = await fetch(`${API_BASE}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: newSessionId,
          messages: session.messages,
          title: `Forked: ${session.title || 'Conversation'}`
        })
      });
      
      if (response.ok) {
        window.location.href = '/'; 
      } else {
        throw new Error('Failed to fork conversation');
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden font-sans">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-inner">
            🤖
          </div>
          <div>
            <h1 className="font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight">Shared Conversation</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Read-only Snapshot • {new Date(session.lastUpdated).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Go App</span>
          </button>
          <button
            onClick={handleFork}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium"
            title="Clone this chat into your workspace"
          >
            <GitFork size={16} />
            <span>Fork Chat</span>
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {session.messages && session.messages.length > 0 ? (
          session.messages.map((msg, idx) => (
            <MessageBubble 
              key={idx} 
              role={msg.role} 
              content={msg.content} 
              sources={msg.sources} 
              followups={msg.followups} 
              onFollowupClick={() => {}} // Disabled in read-only mode
            />
          ))
        ) : (
          <div className="text-center text-gray-500 mt-10">This conversation is empty.</div>
        )}
      </div>
      
      <div className="p-4 text-center border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400">
        RAG Assistant Powered by Groq • AI generations may be inaccurate.
      </div>
    </div>
  );
}
