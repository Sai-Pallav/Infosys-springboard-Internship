import React from 'react';
import { motion } from 'framer-motion';

export default function StatusIndicator({ status }) {
  const config = {
    online: {
      color: 'bg-emerald-500',
      label: 'Online',
      glow: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      dotAnimation: {
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7]
      }
    },
    connecting: {
      color: 'bg-amber-500',
      label: 'Connecting...',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.5)]',
      dotAnimation: {
        scale: [1, 1.5, 1],
        opacity: [0.4, 1, 0.4]
      }
    },
    offline: {
      color: 'bg-rose-500',
      label: 'Offline',
      glow: 'shadow-[0_0_8px_rgba(244,63,94,0.5)]',
      dotAnimation: {
        scale: 1,
        opacity: 1
      }
    }
  };

  const current = config[status] || config.offline;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 dark:bg-black/20 border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm self-center">
      <div className="relative flex items-center justify-center w-2 h-2">
        <motion.div
          animate={current.dotAnimation}
          transition={{
            duration: status === 'connecting' ? 1.5 : 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`w-full h-full rounded-full ${current.color} ${current.glow}`}
        />
        {status === 'online' && (
           <motion.div
             initial={{ scale: 1, opacity: 0.5 }}
             animate={{ scale: 2.5, opacity: 0 }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
             className={`absolute inset-0 rounded-full ${current.color} pointer-events-none`}
           />
        )}
      </div>
      <span className={`text-[11px] font-bold uppercase tracking-wider ${
        status === 'online' ? 'text-emerald-600 dark:text-emerald-400' :
        status === 'connecting' ? 'text-amber-600 dark:text-amber-400' :
        'text-rose-600 dark:text-rose-400'
      }`}>
        {current.label}
      </span>
    </div>
  );
}
