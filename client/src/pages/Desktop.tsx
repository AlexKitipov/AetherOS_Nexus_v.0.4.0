import { useState } from "react";
import { DesktopWindow } from "@/components/DesktopWindow";
import { Taskbar } from "@/components/Taskbar";
import { NexusChat } from "@/pages/NexusChat";
import { SystemMonitor } from "@/pages/SystemMonitor";
import { KernelModules } from "@/pages/KernelModules";

export default function Desktop() {
  const [windows, setWindows] = useState({
    chat: true,
    monitor: true,
    modules: false,
    about: false,
  });

  const toggleWindow = (id: string) => {
    setWindows((prev) => ({
      ...prev,
      [id as keyof typeof windows]: !prev[id as keyof typeof windows],
    }));
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => ({
      ...prev,
      [id as keyof typeof windows]: false,
    }));
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-black font-sans selection:bg-primary/30 selection:text-primary">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-purple-950/10 to-black/80" />
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <div className="scanline" />
        
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* Desktop Area */}
      <div className="relative z-10 h-full pb-12 pointer-events-none">
        
        {/* Make windows interactive */}
        <div className="pointer-events-auto w-full h-full">
          <DesktopWindow
            id="chat"
            title="NEXUS_UPLINK // CHAT"
            isOpen={windows.chat}
            onClose={() => closeWindow("chat")}
            initialPosition={{ x: 50, y: 50 }}
            width="w-[450px]"
            height="h-[600px]"
            className="border-primary/40"
          >
            <NexusChat />
          </DesktopWindow>

          <DesktopWindow
            id="monitor"
            title="SYSTEM_DIAGNOSTICS"
            isOpen={windows.monitor}
            onClose={() => closeWindow("monitor")}
            initialPosition={{ x: 550, y: 50 }}
            width="w-[500px]"
            height="h-[350px]"
            className="border-secondary/40"
          >
            <SystemMonitor />
          </DesktopWindow>

          <DesktopWindow
            id="modules"
            title="KERNEL_MODULES"
            isOpen={windows.modules}
            onClose={() => closeWindow("modules")}
            initialPosition={{ x: 100, y: 200 }}
            width="w-[600px]"
            height="h-[400px]"
            className="border-green-500/40"
          >
            <KernelModules />
          </DesktopWindow>

          <DesktopWindow
            id="about"
            title="ABOUT_NEXUS"
            isOpen={windows.about}
            onClose={() => closeWindow("about")}
            initialPosition={{ x: 300, y: 300 }}
            width="w-[400px]"
            height="h-[250px]"
          >
             <div className="p-4 text-center space-y-4">
                <h1 className="text-2xl font-bold text-primary tracking-widest">AETHER OS</h1>
                <h2 className="text-lg text-white font-mono">NEXUS CORE v0.1</h2>
                <div className="h-px w-20 mx-auto bg-white/20" />
                <p className="text-xs text-muted-foreground">
                  Experimental Web Operating System Environment.
                  <br />
                  Developed for advanced neural interface testing.
                </p>
                <div className="text-[10px] font-mono text-primary/50 pt-4">
                  BUILD 2024.10.24 // STABLE
                </div>
             </div>
          </DesktopWindow>
        </div>
      </div>

      {/* Taskbar */}
      <Taskbar openWindows={windows} toggleWindow={toggleWindow} />
    </div>
  );
}
