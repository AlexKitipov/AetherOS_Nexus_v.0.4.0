import { useSystemStatus } from "@/hooks/use-system";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Cpu, Zap, Wifi } from "lucide-react";
import { useState, useEffect } from "react";

// Helper to accumulate data points for the graph
export function SystemMonitor() {
  const { data: status } = useSystemStatus();
  const [history, setHistory] = useState<{ time: string; cpu: number; memory: number }[]>([]);

  useEffect(() => {
    if (status) {
      setHistory(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          cpu: status.cpu,
          memory: status.memory
        };
        const newHistory = [...prev, newPoint];
        return newHistory.slice(-20); // Keep last 20 points
      });
    }
  }, [status]);

  if (!status) return <div className="p-4 text-primary animate-pulse">INITIALIZING SENSORS...</div>;

  return (
    <div className="space-y-6 h-full flex flex-col font-mono text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Cpu className="w-4 h-4" />
            <span className="font-bold">CPU LOAD</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{status.cpu}%</div>
          <div className="w-full bg-primary/20 h-1 mt-2">
            <div 
              className="bg-primary h-full transition-all duration-500 ease-out" 
              style={{ width: `${status.cpu}%` }} 
            />
          </div>
        </div>

        <div className="bg-secondary/5 border border-secondary/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-secondary">
            <Zap className="w-4 h-4" />
            <span className="font-bold">MEMORY</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{status.memory}%</div>
          <div className="w-full bg-secondary/20 h-1 mt-2">
            <div 
              className="bg-secondary h-full transition-all duration-500 ease-out" 
              style={{ width: `${status.memory}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-black/20 border border-primary/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary/70 text-xs tracking-widest uppercase">Performance History</h3>
          <Wifi className="w-4 h-4 text-green-500 animate-pulse" />
        </div>
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#bc13fe" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#bc13fe" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Area 
              type="monotone" 
              dataKey="cpu" 
              stroke="#00f3ff" 
              fillOpacity={1} 
              fill="url(#colorCpu)" 
            />
            <Area 
              type="monotone" 
              dataKey="memory" 
              stroke="#bc13fe" 
              fillOpacity={1} 
              fill="url(#colorMem)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
        <div className="bg-white/5 p-2 rounded text-center">
          <div>KERNEL</div>
          <div className="text-primary mt-1">v.0.1.4-alpha</div>
        </div>
        <div className="bg-white/5 p-2 rounded text-center">
          <div>UPTIME</div>
          <div className="text-primary mt-1">
            {Math.floor(status.uptime / 1000 / 60)} MIN
          </div>
        </div>
        <div className="bg-white/5 p-2 rounded text-center">
          <div>THREADS</div>
          <div className="text-primary mt-1">128 Active</div>
        </div>
      </div>
    </div>
  );
}
