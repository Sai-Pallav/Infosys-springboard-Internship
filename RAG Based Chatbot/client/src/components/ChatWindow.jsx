import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, Mic, Download, Square, Share, Zap, Plus, Trash2, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { clsx } from 'clsx';

export default function ChatWindow({ messages, currentSessionId, onSendMessage, onFileUpload, isLoading, isSidebarOpen, onStopGeneration, settings }) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const promptMenuRef = useRef(null);
  const promptButtonRef = useRef(null);

  const scrollContainerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showPrompts, setShowPrompts] = useState(false);
  const [newPromptText, setNewPromptText] = useState('');
  const [isAddingPrompt, setIsAddingPrompt] = useState(false);

  const [promptTemplates, setPromptTemplates] = useState(() => {
    const saved = localStorage.getItem('rag_prompts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved prompts", e);
      }
    }
    return [
      "Summarize the active documents in 3 bullet points.",
      "Extract all actionable tasks from the text.",
      "Rewrite my last message to be highly professional.",
      "Explain this topic to me like I am 5 years old.",
      "What are the main drawbacks or counter-arguments mentioned?"
    ];
  });

  const savePrompts = (newPrompts) => {
    setPromptTemplates(newPrompts);
    localStorage.setItem('rag_prompts', JSON.stringify(newPrompts));
  };

  const addPrompt = (e) => {
    e.preventDefault();
    if (newPromptText.trim()) {
      savePrompts([...promptTemplates, newPromptText.trim()]);
      setNewPromptText('');
      setIsAddingPrompt(false);
    }
  };

  const deletePrompt = (e, index) => {
    e.stopPropagation();
    const updated = promptTemplates.filter((_, i) => i !== index);
    savePrompts(updated);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setIsNearBottom(scrollHeight - scrollTop - clientHeight < 100);
  };

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const scrollToBottom = () => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPrompts && 
          promptMenuRef.current && !promptMenuRef.current.contains(event.target) &&
          promptButtonRef.current && !promptButtonRef.current.contains(event.target)) {
        setShowPrompts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPrompts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const exportChat = () => {
    if (messages.length === 0) return;
    
    let mdContent = "# Chat Export\n\n";
    messages.forEach(msg => {
       const role = msg.role === 'user' ? '**You**' : '**AI Assistant**';
       mdContent += `${role}:\n${msg.content}\n\n`;
       if (msg.sources && msg.sources.length > 0) {
           mdContent += `*Sources: ${msg.sources.join(', ')}*\n\n`;
       }
       mdContent += "---\n\n";
    });

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!currentSessionId) return;
    const shareUrl = `${window.location.origin}/share/${currentSessionId}`;
    navigator.clipboard.writeText(shareUrl);
    import('react-hot-toast').then(({ toast }) => toast.success('Shareable link copied to clipboard!'));
  };

  return (
    <div className="flex-1 flex flex-col h-full relative bg-surface-light dark:bg-[#0a0a0a] transition-all duration-300">
      {/* Top Bar for Chat Window */}
      {messages.length > 0 && (
        <div className="absolute top-4 right-4 z-10 hidden lg:flex gap-2">
           <button 
             onClick={handleShare}
             className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-surface-darker/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-800/50 text-gray-600 dark:text-gray-300 rounded-xl shadow-lg shadow-black/5 hover:bg-white dark:hover:bg-surface-darker hover:text-emerald-500 dark:hover:text-emerald-400 transition-all font-medium text-sm active:scale-95"
             title="Share Conversation"
           >
             <Share size={16} />
             Share
           </button>
           <button 
             onClick={exportChat}
             className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-surface-darker/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-800/50 text-gray-600 dark:text-gray-300 rounded-xl shadow-lg shadow-black/5 hover:bg-white dark:hover:bg-surface-darker hover:text-emerald-500 dark:hover:text-emerald-400 transition-all font-medium text-sm active:scale-95"
             title="Export Chat as Markdown"
           >
             <Download size={16} />
             Export
           </button>
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 scrollbar-hide"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-80 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
              <Sparkles size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-3 tracking-tight">How can I help you today?</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
              Upload a document to analyze it, provide a URL for me to read, or simply ask me a question to get started.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto flex flex-col justify-end min-h-full">
            <div className="space-y-6 lg:space-y-8 pb-4">
              {messages.map((msg, index) => (
                <MessageBubble 
                  key={index}
                  role={msg.role}
                  content={msg.content}
                  sources={msg.sources}
                  followups={msg.followups}
                  onFollowupClick={onSendMessage}
                  settings={settings}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start w-full animate-fade-in">
                   <div className="flex flex-row items-end gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-md flex-shrink-0 animate-pulse">
                        <Loader2 size={16} className="animate-spin" />
                      </div>
                      <div className="bg-white dark:bg-surface-darker border border-gray-100 dark:border-gray-800 px-5 py-4 rounded-2xl rounded-bl-sm shadow-sm">
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                          Processing your request
                          <span className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: "0ms"}}></span>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: "150ms"}}></span>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: "300ms"}}></span>
                          </span>
                        </span>
                      </div>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:px-6 lg:px-8 pb-6 bg-gradient-to-t from-surface-light via-surface-light to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-transparent pt-10">
        <div className="max-w-4xl mx-auto relative animate-fade-in shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_-15px_rgba(16,185,129,0.1)] rounded-[20px]">
          {showPrompts && (
            <div 
              ref={promptMenuRef}
              className="absolute bottom-[calc(100%+12px)] left-0 w-72 bg-white/95 dark:bg-surface-darker/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-2xl z-20 overflow-hidden transform transition-all dark:shadow-black/50"
            >
              <div className="flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-gray-50/80 dark:bg-surface-darker border-b border-gray-100 dark:border-gray-800">
                <span>Prompt Library</span>
                <button
                  type="button"
                  onClick={() => setIsAddingPrompt(!isAddingPrompt)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-all text-emerald-500 active:scale-95"
                  title="Add new prompt"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
              
              {isAddingPrompt && (
                <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                  <form onSubmit={addPrompt} className="flex gap-2">
                    <input
                      type="text"
                      value={newPromptText}
                      onChange={(e) => setNewPromptText(e.target.value)}
                      placeholder="Enter new custom prompt..."
                      className="flex-1 text-sm px-3 py-2 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-shadow placeholder:text-gray-400"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!newPromptText.trim()}
                      className="px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                    >
                      Save
                    </button>
                  </form>
                </div>
              )}

              <ul className="max-h-64 overflow-y-auto scrollbar-hide">
                {promptTemplates.map((prompt, idx) => (
                  <li key={idx} className="group relative border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                    <button
                      type="button"
                      onClick={() => {
                        setInput(prompt);
                        setShowPrompts(false);
                      }}
                      className="w-full text-left px-4 py-4 text-sm text-gray-700 dark:text-gray-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors pr-10 font-medium"
                    >
                      {prompt}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => deletePrompt(e, idx)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm"
                      title="Delete prompt"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
                {promptTemplates.length === 0 && !isAddingPrompt && (
                  <li className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 m-3 rounded-xl bg-gray-50/50 dark:bg-surface-darker/50">
                    No custom prompts yet. Click the + icon to add your favorites.
                  </li>
                )}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 lg:gap-3 bg-white dark:bg-surface-darker border border-gray-300 dark:border-gray-700 rounded-[20px] p-2 focus-within:ring-[3px] focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-lg dark:shadow-none">
            <div className="flex bg-gray-50 dark:bg-[#121212] rounded-xl border border-gray-200 dark:border-gray-800 p-0.5 ml-1 mb-1">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.txt"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                title="Attach Document"
              >
                <Paperclip size={20} strokeWidth={2} />
              </button>
              <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 my-auto mx-0.5"></div>
              <button
                type="button"
                onClick={toggleListen}
                className={clsx(
                  "p-2.5 rounded-lg transition-colors border-none",
                  isListening ? "text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse" : "text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                )}
                title={isListening ? "Listening..." : "Voice Input"}
              >
                <Mic size={20} strokeWidth={2} />
              </button>
              <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 my-auto mx-0.5"></div>
              <button
                type="button"
                ref={promptButtonRef}
                onClick={() => setShowPrompts(!showPrompts)}
                className={clsx(
                  "p-2.5 rounded-lg transition-colors border-none",
                  showPrompts ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20" : "text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                )}
                title="Prompt Templates"
              >
                <Zap size={20} strokeWidth={2} />
              </button>
            </div>
            
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to summarize, extract data, or explain... (Shift + Enter for new line)"
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3.5 px-3 max-h-40 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500/80 text-[15px] leading-relaxed scrollbar-hide font-medium mb-0.5"
              rows={1}
              style={{ minHeight: '52px' }}
            />
            
            <div className="mb-1 mr-1">
              {isLoading ? (
                <button 
                  type="button"
                  onClick={onStopGeneration}
                  className="p-3.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-md animate-pulse active:scale-95 group"
                  title="Stop Generating"
                >
                  <Square size={20} className="fill-current" />
                </button>
              ) : (
                <button 
                  type="submit"
                  disabled={!input.trim()}
                  className="p-3.5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 disabled:dark:from-gray-700 disabled:dark:to-gray-700 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                  title="Send Message (Enter)"
                >
                  <Send size={20} strokeWidth={2.5} className="mr-0.5" />
                </button>
              )}
            </div>
          </form>
          <div className="text-center mt-3 text-xs font-medium text-gray-400 dark:text-gray-500 tracking-wide">
            AI can make mistakes. Please verify important information.
          </div>
        </div>
      </div>
    </div>
  );
}
