import React from 'react';
import { motion } from 'framer-motion';

type MotionDivProps = React.ComponentProps<typeof motion.div>;

interface GlassCardProps extends MotionDivProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard = ({ children, className = '', hoverEffect = true, ...props }: GlassCardProps) => {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 }
      }}
      whileHover={hoverEffect ? { scale: 1.02 } : undefined}
      className={`glass-panel p-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
