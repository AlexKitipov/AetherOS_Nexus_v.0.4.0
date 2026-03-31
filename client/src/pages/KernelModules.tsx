import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Shield, Radio, Globe, Brain, Database, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function KernelModules() {
  const modules = [
    { id: "net", name: "Network Stack", icon: Globe, color: "text-blue-400" },
    { id: "sec", name: "Security Layer", icon: Shield, color: "text-green-400" },
    { id: "ai", name: "Neural Engine", icon: Brain, color: "text-purple-400" },
    { id: "db", name: "Data Persistence", icon: Database, color: "text-yellow-400" },
    { id: "io", name: "I/O Controller", icon: Radio, color: "text-orange-400" },
    { id: "virt", name: "Virtualization", icon: Layers, color: "text-cyan-400" },
  ];

  const [activeModules, setActiveModules] = useState<Record<string, boolean>>({
    net: true, sec: true, ai: true, db: true, io: true, virt: false
  });

  const toggleModule = (id: string) => {
    setActiveModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-full overflow-y-auto p-1">
      {modules.map((mod) => (
        <div 
          key={mod.id}
          className={cn(
            "p-4 rounded-lg border transition-all duration-300 relative overflow-hidden group",
            activeModules[mod.id] 
              ? "bg-white/5 border-primary/30 shadow-[0_0_15px_rgba(0,243,255,0.1)]" 
              : "bg-black/40 border-white/5 opacity-60"
          )}
        >
          {/* Background Glow Effect */}
          {activeModules[mod.id] && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-[50px] -translate-y-1/2 translate-x-1/2" />
          )}

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded bg-black/50 border border-white/10", mod.color)}>
                <mod.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-200">{mod.name}</h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  {activeModules[mod.id] ? "ACTIVE • RUNNING" : "INACTIVE • HALTED"}
                </p>
              </div>
            </div>
            <Switch 
              checked={activeModules[mod.id]}
              onCheckedChange={() => toggleModule(mod.id)}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="mt-4 h-1 w-full bg-white/5 rounded overflow-hidden">
            {activeModules[mod.id] && (
              <div className="h-full bg-primary/50 animate-progress-indeterminate w-1/3" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
