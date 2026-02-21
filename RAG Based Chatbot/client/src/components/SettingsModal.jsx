import { X, Save, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SettingsModal({ isOpen, onClose, onSave, currentSettings }) {
  const [model, setModel] = useState(currentSettings?.model || 'llama-3.1-8b-instant');
  const [systemPrompt, setSystemPrompt] = useState(currentSettings?.systemPrompt || 'You are a helpful, smart, kind, and efficient AI assistant. You always fulfill the user\'s requests to the best of your ability.');
  const [voicePreference, setVoicePreference] = useState(currentSettings?.voicePreference || 'male');
  const [darkMode, setDarkMode] = useState(currentSettings?.darkMode || false);

  useEffect(() => {
    if (isOpen && currentSettings) {
      setModel(currentSettings.model || 'llama-3.1-8b-instant');
      setSystemPrompt(currentSettings.systemPrompt || 'You are a helpful, smart, kind, and efficient AI assistant. You always fulfill the user\'s requests to the best of your ability.');
      setVoicePreference(currentSettings.voicePreference || 'male');
      setDarkMode(currentSettings.darkMode || false);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ model, systemPrompt, voicePreference, darkMode });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                AI Model
              </label>
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 pr-10 transition-all cursor-pointer"
              >
                <option value="llama-3.1-8b-instant">LLaMA 3.1 (8B) - Fast & Capable</option>
                <option value="llama-3.3-70b-versatile">LLaMA 3.3 (70B) - Highly Accurate</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B (Large Context)</option>
                <option value="gemma2-9b-it">Gemma 2 (9B) (Google)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <ChevronDown size={18} />
              </div>
            </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select the underlying Groq model. 70B models are smarter but slightly slower.
              </p>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Custom System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 resize-none"
                placeholder="e.g., You are a snarky programming assistant..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Define the AI's persona and core instructions. Applies to new chat sessions.
              </p>
            </div>

            {/* Voice Preference */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Voice Preference (Text-to-Speech)
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="voice" 
                    value="male" 
                    checked={voicePreference === 'male'} 
                    onChange={(e) => setVoicePreference(e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="voice" 
                    value="female" 
                    checked={voicePreference === 'female'} 
                    onChange={(e) => setVoicePreference(e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Female</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose the gender for the Read Aloud feature.
              </p>
            </div>

            {/* Theme Preference */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">Dark Mode</span>
              <div 
                className="relative w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors overflow-hidden"
                onClick={() => setDarkMode(!darkMode)}
              >
                <motion.div 
                  initial={false}
                  animate={{ 
                    x: darkMode ? 24 : 4,
                    backgroundColor: darkMode ? "#3b82f6" : "#ffffff"
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 rounded-full shadow-md z-10"
                />
                <motion.div 
                  initial={false}
                  animate={{ 
                    backgroundColor: darkMode ? "rgba(59, 130, 246, 0.2)" : "transparent"
                  }}
                  className="absolute inset-0 transition-colors"
                />
              </div>
            </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Toggle between light and dark visual themes.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm active:scale-95"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
