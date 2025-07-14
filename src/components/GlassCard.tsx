import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`
        backdrop-blur-lg
        bg-white/70 dark:bg-gray-800/70
        shadow-lg
        border border-white/20 dark:border-gray-700/30
        rounded-2xl
        hover:shadow-xl
        transition-shadow duration-300
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard; 