import React from 'react';
import { motion } from 'framer-motion';
import { Upload, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({
  title = 'No Model Uploaded',
  description = 'Upload a model from the Dashboard to get started.',
}: EmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex items-center justify-center"
      >
        {/* Glow ring */}
        <div className="absolute w-36 h-36 rounded-full bg-core-purple/20 blur-[40px]" />
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
          <AlertCircle size={44} className="text-slate-500" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 max-w-sm">{description}</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-7 py-3 rounded-full bg-core-purple text-white font-semibold shadow-[0_4px_20px_rgba(109,93,251,0.4)] hover:bg-[#5e4ee8] transition-colors"
      >
        <Upload size={18} />
        Go to Dashboard
      </motion.button>
    </div>
  );
}
