import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Radio, Globe, Brain, Database, Layers, Play, Pause, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendKernelCommand, useKernelStatus, useKernelTasks } from "@/hooks/use-system";
import { api } from "@shared/routes";

const MODULE_ICONS = {
  net: Globe,
  sec: Shield,
  ai: Brain,
  db: Database,
  io: Radio,
  virt: Layers,
} as const;

const MODULE_COLORS = {
  net: "text-blue-400",
  sec: "text-green-400",
  ai: "text-purple-400",
  db: "text-yellow-400",
  io: "text-orange-400",
  virt: "text-cyan-400",
} as const;

export function KernelModules() {
  const { data: status } = useKernelStatus();
  const { data: tasks } = useKernelTasks();
  const queryClient = useQueryClient();

  const [runCommandInput, setRunCommandInput] = useState("task:diagnostic --module net");
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [bridgeLog, setBridgeLog] = useState<string[]>([]);

  const modules = status?.modules ?? [];
  const recentTasks = useMemo(() => (tasks ?? []).slice(0, 4), [tasks]);

  const refreshKernelQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [api.kernel.status.path] }),
      queryClient.invalidateQueries({ queryKey: [api.kernel.processes.path] }),
    ]);
  };

  const appendBridgeLog = (line: string) => {
    setBridgeLog((prev) => [line, ...prev].slice(0, 6));
  };

  const onToggleModule = async (moduleId: string, enabled: boolean) => {
    try {
      const result = await sendKernelCommand({
        type: "module.manage",
        payload: { moduleId, enabled },
      });

      appendBridgeLog(`${result.type} accepted for module:${moduleId}`);
    } catch (error) {
      appendBridgeLog(error instanceof Error ? error.message : "Module update rejected");
    } finally {
      await refreshKernelQueries();
    }
  };

  const onRunTask = async () => {
    if (!runCommandInput.trim()) return;

    try {
      const result = await sendKernelCommand({
        type: "task.run",
        payload: { command: runCommandInput.trim() },
      });

      appendBridgeLog(`${result.type} dispatched: ${runCommandInput.trim()}`);
      setRunCommandInput("");
    } catch (error) {
      appendBridgeLog(error instanceof Error ? error.message : "Task dispatch failed");
    } finally {
      await refreshKernelQueries();
    }
  };

  const onManageTask = async (taskId: string, action: "stop" | "resume") => {
    setPendingTaskId(taskId);

    try {
      const result = await sendKernelCommand({
        type: "task.manage",
        payload: { taskId, action },
      });

      appendBridgeLog(`${result.type} ${action} for ${taskId}`);
    } catch (error) {
      appendBridgeLog(error instanceof Error ? error.message : "Task manage command failed");
    } finally {
      setPendingTaskId(null);
      await refreshKernelQueries();
    }
  };

  return (
    <div className="grid grid-cols-5 gap-4 h-full overflow-y-auto p-1">
      <div className="col-span-3 grid grid-cols-2 gap-4 content-start">
        {modules.map((mod) => {
          const Icon = MODULE_ICONS[mod.id as keyof typeof MODULE_ICONS] ?? Layers;
          const color = MODULE_COLORS[mod.id as keyof typeof MODULE_COLORS] ?? "text-primary";
          const isActive = mod.state === "active";

          return (
            <div
              key={mod.id}
              className={cn(
                "p-4 rounded-lg border transition-all duration-300 relative overflow-hidden group",
                isActive
                  ? "bg-white/5 border-primary/30 shadow-[0_0_15px_rgba(0,243,255,0.1)]"
                  : "bg-black/40 border-white/5 opacity-70",
              )}
            >
              {isActive && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-[50px] -translate-y-1/2 translate-x-1/2" />
              )}

              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded bg-black/50 border border-white/10", color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-200">{mod.name}</h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {isActive ? "ACTIVE • RUNNING" : "INACTIVE • HALTED"}
                    </p>
                    {!mod.mutable && (
                      <p className="text-[10px] text-amber-400/90 font-mono mt-1">IMMUTABLE V-NODE</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={isActive}
                  disabled={!mod.mutable}
                  onCheckedChange={(checked) => onToggleModule(mod.id, checked)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="mt-4 h-1 w-full bg-white/5 rounded overflow-hidden">
                {isActive && <div className="h-full bg-primary/50 animate-progress-indeterminate w-1/3" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="col-span-2 border border-primary/20 rounded-lg p-3 bg-black/30 space-y-3">
        <div className="text-xs uppercase tracking-widest text-primary/70">Kernel IPC Console</div>

        <div className="flex gap-2">
          <Input
            value={runCommandInput}
            onChange={(e) => setRunCommandInput(e.target.value)}
            className="bg-black/50 border-primary/30 text-primary font-mono text-xs"
            placeholder="task:diagnostic --module net"
          />
          <Button onClick={onRunTask} size="icon" className="bg-primary text-black hover:bg-primary/80">
            <Play className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="border-primary/30"
            onClick={() => refreshKernelQueries()}
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tasks</div>
          {recentTasks.map((task) => {
            const running = task.status === "running";
            return (
              <div key={task.id} className="border border-white/10 rounded p-2 text-xs bg-black/40">
                <div className="flex justify-between gap-2">
                  <span className="truncate text-primary">{task.command}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">{task.status}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{task.id}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px]"
                    disabled={pendingTaskId === task.id}
                    onClick={() => onManageTask(task.id, running ? "stop" : "resume")}
                  >
                    {running ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                    {running ? "stop" : "resume"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Bridge log</div>
          <div className="border border-white/10 rounded p-2 bg-black/40 min-h-20 text-[10px] font-mono space-y-1">
            {bridgeLog.length === 0 && <div className="text-muted-foreground">No commands yet.</div>}
            {bridgeLog.map((entry) => (
              <div key={entry}>{entry}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
