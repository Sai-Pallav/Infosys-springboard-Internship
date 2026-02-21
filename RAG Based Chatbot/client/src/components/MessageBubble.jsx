import { User, Bot, Copy, Check, Volume2, Square, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';

export default function MessageBubble({ role, content, sources, followups, onFollowupClick, settings }) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const displayContent = content.split("FOLLOWUP:")[0];
      const utterance = new SpeechSynthesisUtterance(displayContent);
      
      // Voice Selection Logic
      const voices = window.speechSynthesis.getVoices();
      const preference = settings?.voicePreference || 'male';
      
      let selectedVoice = null;
      if (preference === 'female') {
          // Attempt to find a female sounding voice
          selectedVoice = voices.find(v => 
            v.name.toLowerCase().includes('female') || 
            v.name.toLowerCase().includes('zira') || 
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('google uk english female')
          );
      } else {
          // Attempt to find a male sounding voice
          selectedVoice = voices.find(v => 
            v.name.toLowerCase().includes('male') || 
            v.name.toLowerCase().includes('david') || 
            v.name.toLowerCase().includes('google uk english male')
          );
      }
      
      if (selectedVoice) utterance.voice = selectedVoice;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const displayContent = content.split("FOLLOWUP:")[0];

  return (
    <div className={clsx("flex w-full mb-8 animate-slide-up", isUser ? "justify-end" : "justify-start")}>
      <div className={clsx(
        "flex max-w-[88%] md:max-w-[80%] gap-3 md:gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        <div className={clsx(
          "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md",
          isUser ? "bg-gradient-to-br from-gray-700 to-gray-900 text-white" : "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white"
        )}>
          {isUser ? <User size={18} className="md:w-5 md:h-5" /> : <Bot size={18} className="md:w-5 md:h-5" />}
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <div className={clsx(
            "relative px-5 py-4 min-h-[44px] shadow-sm text-[15px] leading-relaxed group transition-all",
            isUser 
              ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-[24px] rounded-tr-[8px]" 
              : "bg-white dark:bg-surface-darker border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-[24px] rounded-tl-[8px] hover:shadow-md hover:border-emerald-100 dark:hover:border-emerald-900/30"
          )}>
            {!isUser && (
              <div className="absolute -top-3 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg rounded-lg p-1 z-10">
                 <button 
                  onClick={handleSpeak}
                  className="p-1.5 text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors"
                  title={isSpeaking ? "Stop speaking" : "Read aloud"}
                >
                  {isSpeaking ? <Square size={14} className="text-red-500 fill-current" /> : <Volume2 size={14} />}
                </button>
                <button 
                  onClick={handleCopy}
                  className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Copy message"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            )}
            
             <div className="prose prose-sm max-w-none dark:prose-invert break-words prose-p:leading-relaxed prose-pre:my-2 prose-headings:font-bold prose-a:text-emerald-500">
               <ReactMarkdown 
                 remarkPlugins={[remarkGfm]}
                 components={{
                   code({node, inline, className, children, ...props}) {
                     const match = /language-(\w+)/.exec(className || '');
                     const codeString = String(children).replace(/\n$/, '');
                     
                     const copyCode = () => {
                       navigator.clipboard.writeText(codeString);
                       toast.success('Code copied!');
                     };

                     return !inline && match ? (
                       <div className="relative group/code mt-3 mb-5 shadow-lg rounded-lg overflow-hidden border border-gray-800/80">
                         <div className="flex justify-between items-center bg-[#18181b] text-gray-400 text-xs px-4 py-2 border-b border-gray-800/80">
                            <span className="font-mono text-[11px] uppercase tracking-wider text-gray-500">{match[1]}</span>
                            <button 
                              onClick={copyCode}
                              className="opacity-0 group-hover/code:opacity-100 transition-all flex items-center gap-1.5 hover:text-emerald-400 font-medium bg-white/5 px-2 py-1 rounded"
                            >
                              <Copy size={12} /> Copy code
                            </button>
                         </div>
                         <SyntaxHighlighter
                           {...props}
                           children={codeString}
                           style={vscDarkPlus}
                           language={match[1]}
                           PreTag="div"
                           className="!mt-0 !bg-[#09090b] !rounded-none !text-[13px] border-none"
                         />
                       </div>
                     ) : (
                       <code {...props} className={clsx(className, "bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300 font-mono text-[13px] font-semibold tracking-tight border border-emerald-500/20")}>
                         {children}
                       </code>
                     );
                   }
                 }}
               >
                 {displayContent}
               </ReactMarkdown>
             </div>
          </div>

          {sources && sources.length > 0 && (
             <div className="flex flex-wrap gap-2 mt-1 px-1">
               {sources.map((source, idx) => (
                 <span key={idx} className="text-xs bg-surface-hoverLight dark:bg-surface-dark font-medium text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"></div>
                   {source}
                 </span>
               ))}
             </div>
          )}

          {followups && followups.length > 0 && (
             <div className="flex flex-col gap-2 mt-4 px-1 animate-fade-in" style={{animationDelay: '150ms'}}>
               <span className="text-[11px] text-gray-400 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles size={12} className="text-emerald-500 flex-shrink-0" />
                  Suggested Follow-ups
               </span>
               <div className="flex flex-wrap gap-2">
                 {followups.map((q, idx) => (
                   <button 
                     key={idx} 
                     onClick={() => onFollowupClick(q)}
                     className="text-[13px] font-medium text-left bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3.5 py-2 rounded-xl transition-all border border-emerald-200/50 dark:border-emerald-800/30 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 group"
                   >
                     {q} <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 inline-block -translate-x-1 group-hover:translate-x-0">→</span>
                   </button>
                 ))}
               </div>
             </div>
          )}
          
          <span className="text-[10px] text-gray-400 px-1">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
