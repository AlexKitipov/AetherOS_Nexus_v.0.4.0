import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DesktopWindowProps {
  id: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  children: ReactNode;
  className?: string;
  initialPosition?: { x: number; y: number };
  width?: string;
  height?: string;
}

export function DesktopWindow({
  id,
  title,
  isOpen,
  onClose,
  children,
  className,
  initialPosition = { x: 100, y: 100 },
  width = "w-[600px]",
  height = "h-[400px]",
}: DesktopWindowProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          drag
          dragMomentum={false}
          className={cn(
            "fixed flex flex-col overflow-hidden rounded-lg glass-panel shadow-2xl shadow-primary/10 z-10",
            width,
            height,
            className
          )}
          style={{ left: initialPosition.x, top: initialPosition.y }}
        >
          {/* Window Title Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-primary/20 cursor-grab active:cursor-grabbing handle">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold text-primary tracking-widest uppercase font-mono">
                {title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-white/10 rounded transition-colors text-primary/70 hover:text-primary">
                <Minus className="w-3 h-3" />
              </button>
              <button className="p-1 hover:bg-white/10 rounded transition-colors text-primary/70 hover:text-primary">
                <Maximize2 className="w-3 h-3" />
              </button>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors text-primary/70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Window Content */}
          <div className="flex-1 overflow-auto bg-black/20 p-4 relative">
            <div className="absolute inset-0 pointer-events-none bg-[url('/grid-pattern.png')] opacity-5" />
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
