import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-primary font-mono relative overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      <div className="z-10 text-center space-y-6 border border-primary/30 p-12 rounded-xl bg-black/50 backdrop-blur-xl shadow-[0_0_50px_rgba(0,243,255,0.1)]">
        <AlertTriangle className="w-24 h-24 mx-auto text-red-500 animate-pulse" />
        
        <h1 className="text-6xl font-bold tracking-tighter">404</h1>
        <div className="text-xl tracking-widest text-red-400">
          SYSTEM ERROR: ROUTE NOT FOUND
        </div>
        
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          The requested memory address could not be accessed. The segment may have been corrupted or does not exist in the current kernel map.
        </p>

        <div className="pt-6">
          <Link href="/" className="px-8 py-3 bg-primary text-black font-bold rounded hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all">
            RETURN TO SHELL
          </Link>
        </div>
      </div>
    </div>
  );
}
