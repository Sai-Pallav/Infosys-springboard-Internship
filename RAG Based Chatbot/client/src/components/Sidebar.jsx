import { MessageSquare, Plus, Settings, Github, Menu, X, Trash2, FileText, Loader2, Moon, Sun, Link, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_BASE } from '../config';
import StatusIndicator from './StatusIndicator';

export default function Sidebar({ 
  isOpen, setIsOpen, sessions, currentSessionId, onSelectSession, onNewChat, 
  onDeleteSession, onOpenSettings, settings, onSaveSettings,
  documents, setDocuments, activeDocuments, setActiveDocuments, onUrlIngest,
  backendStatus
}) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
  const deleteDocument = async (filename) => {
    try {
        await fetch(`${API_BASE}/documents/${filename}`, { method: 'DELETE' });
        setDocuments(prev => prev.filter(d => d !== filename));
        setActiveDocuments(prev => prev.filter(d => d !== filename));
    } catch (e) {
        console.error("Failed to delete doc", e);
    }
  };

  const toggleDocument = (filename) => {
    setActiveDocuments(prev => 
      prev.includes(filename) 
        ? prev.filter(d => d !== filename) 
        : [...prev, filename]
    );
  };

  const toggleAllDocuments = () => {
    if (activeDocuments.length === documents.length) {
      setActiveDocuments([]);
    } else {
      setActiveDocuments([...documents]);
    }
  };
  
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={clsx(
          "fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Content */}
      <aside 
        className={clsx(
          "fixed top-0 left-0 z-50 h-full w-72 bg-[#0c0c0c] text-gray-100 transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:w-72 border-r border-gray-800/60 flex flex-col shadow-2xl lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b border-gray-800/60 flex items-center justify-between bg-gradient-to-b from-surface-darker/60 to-transparent">
          <div className="flex items-center gap-3 font-bold text-lg tracking-tight">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shadow-inner">
              ✨
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">RAG AI</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 hover:bg-gray-800/80 rounded-xl transition-colors text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 relative">
          <button 
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/40 hover:shadow-emerald-500/30 font-semibold active:scale-[0.98] border border-emerald-400/20"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-hide">
          <div className="text-xs font-semibold text-emerald-500/80 uppercase tracking-widest mb-3 px-3 mt-1">History</div>
          {sessions.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-800 rounded-xl mx-2 bg-surface-darker/30">
              No chat history
            </div>
          ) : (
            sessions.map((session, index) => (
              <div 
                key={session.id || index}
                className={clsx(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm font-medium border",
                  session.id === currentSessionId ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-inner" : "text-gray-400 border-transparent hover:bg-surface-darker/50 hover:text-gray-200 hover:border-gray-800/50"
                )}
                onClick={() => {
                   onSelectSession(session.id);
                   if (window.innerWidth < 1024) setIsOpen(false);
                }}
              >
                <MessageSquare size={16} className={session.id === currentSessionId ? "text-emerald-500" : "text-gray-500"} />
                <span className="flex-1 truncate text-xs tracking-wide">{session.title || "New Conversation"}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all active:scale-90"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 border-t border-gray-800">
        <div className="flex items-center justify-between mt-2 mb-2 px-2">
             <div className="text-xs font-semibold text-emerald-500/80 uppercase tracking-widest pl-1">Documents</div>
             <div className="flex items-center gap-1">
               <button 
                 onClick={() => setShowUrlInput(!showUrlInput)}
                 className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-emerald-500/20"
                 title="Add URL"
               >
                 <Link size={14} />
               </button>
               {documents.length > 0 && (
                 <button 
                   onClick={toggleAllDocuments}
                   className="text-[10px] uppercase tracking-wide font-medium text-emerald-400 hover:text-emerald-300 transition-colors px-1"
                 >
                   {activeDocuments.length === documents.length ? 'Deselect All' : 'Select All'}
                 </button>
               )}
             </div>
           </div>
           
           {showUrlInput && (
             <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (urlInput.trim()) {
                  onUrlIngest(urlInput.trim());
                  setUrlInput('');
                  setShowUrlInput(false);
                }
              }}
              className="px-2 mb-3 flex gap-2 animate-fade-in"
             >
               <input 
                 type="url" 
                 value={urlInput}
                 onChange={(e) => setUrlInput(e.target.value)}
                 placeholder="https://example.com"
                 className="flex-1 bg-surface-darker/50 border border-gray-700/50 text-white text-xs rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-gray-600"
                 required
               />
               <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-all shadow-sm shadow-emerald-900/20 active:scale-95"
               >
                 <Send size={14} />
               </button>
             </form>
           )}

           {documents.length === 0 ? (
             <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-800 rounded-xl mx-2 bg-surface-darker/30">
               No files uploaded
             </div>
           ) : (
             <div className="space-y-0.5 px-1">
               {documents.map((doc, idx) => (
                 <div key={idx} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-darker/50 transition-all text-sm border border-transparent hover:border-gray-800/50 cursor-pointer" onClick={() => toggleDocument(doc)}>
                   <div className="relative flex items-center justify-center w-4 h-4">
                     <input 
                       type="checkbox" 
                       checked={activeDocuments.includes(doc)}
                       onChange={() => toggleDocument(doc)}
                       className="peer appearance-none w-4 h-4 border border-gray-600 rounded bg-transparent checked:bg-emerald-500 checked:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-1 focus:ring-offset-gray-900 transition-all cursor-pointer z-10"
                       onClick={(e) => e.stopPropagation()}
                     />
                     <svg className="absolute w-2.5 h-2.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 peer-checked:scale-100 scale-50 transition-all duration-200 z-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                       <polyline points="20 6 9 17 4 12" />
                     </svg>
                   </div>
                   <FileText size={14} className={clsx("transition-colors", activeDocuments.includes(doc) ? "text-emerald-400" : "text-gray-500")} />
                   <span className={clsx("flex-1 truncate text-xs font-medium transition-colors", activeDocuments.includes(doc) ? "text-gray-200" : "text-gray-500 group-hover:text-gray-400")} title={doc}>
                     {doc}
                   </span>
                   <button 
                     onClick={(e) => { e.stopPropagation(); deleteDocument(doc); }}
                     className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 text-gray-500 rounded-lg transition-all active:scale-90"
                     title="Delete document"
                   >
                     <Trash2 size={14} />
                   </button>
                 </div>
               ))}
             </div>
           )}
        </div>

        <div className="p-4 border-t border-gray-800/60 bg-surface-darker/20 backdrop-blur-xl flex justify-center">
          <button 
            onClick={() => {
              if (window.innerWidth < 1024) setIsOpen(false);
              onOpenSettings();
            }}
            className="w-full max-w-[200px] flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-all px-3 py-2.5 rounded-xl hover:bg-surface-darker/80 border border-transparent hover:border-gray-700/50 active:scale-95 font-medium"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
