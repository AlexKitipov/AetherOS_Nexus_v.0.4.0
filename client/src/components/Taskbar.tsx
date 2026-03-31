import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Terminal, Activity, MessageSquare, Info, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskbarProps {
  openWindows: Record<string, boolean>;
  toggleWindow: (id: string) => void;
}

export function Taskbar({ openWindows, toggleWindow }: TaskbarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const apps = [
    { id: "chat", label: "Nexus Chat", icon: MessageSquare },
    { id: "monitor", label: "Sys Monitor", icon: Activity },
    { id: "modules", label: "Kernel", icon: Cpu },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-black/80 backdrop-blur-md border-t border-primary/30 flex items-center justify-between px-4 z-50">
      
      {/* Start Button */}
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded transition-all group">
          <Terminal className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-bold text-primary tracking-widest font-mono hidden md:block">
            NEXUS CORE
          </span>
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-primary/20" />

        {/* App Icons */}
        <div className="flex items-center gap-1">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => toggleWindow(app.id)}
              className={cn(
                "p-2 rounded transition-all relative group",
                openWindows[app.id] 
                  ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(0,243,255,0.3)]" 
                  : "text-muted-foreground hover:text-primary hover:bg-white/5"
              )}
            >
              <app.icon className="w-5 h-5" />
              {/* Tooltipish label */}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-primary/30 text-primary text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {app.label}
              </span>
              {/* Active indicator */}
              {openWindows[app.id] && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full box-shadow-[0_0_5px_var(--neon-blue)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* System Tray */}
      <div className="flex items-center gap-4 text-xs font-mono text-primary/80">
        <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-black/40 rounded border border-white/5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          ONLINE
        </div>
        <div className="px-2 py-1">
          {format(time, "HH:mm:ss")}
        </div>
      </div>
    </div>
  );
}
