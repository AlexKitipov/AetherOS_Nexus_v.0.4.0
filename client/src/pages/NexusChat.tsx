import { useState, useEffect, useRef } from "react";
import { useConversations, useConversation, useCreateConversation, useDeleteConversation, useChatStream } from "@/hooks/use-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Send, Cpu, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function NexusChat() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  
  const { data: conversations, isLoading: loadingConvos } = useConversations();
  const { data: activeConversation, isLoading: loadingActive } = useConversation(activeId);
  const createMutation = useCreateConversation();
  const deleteMutation = useDeleteConversation();
  
  // Streaming hook
  const { sendMessage, isStreaming, streamedContent } = useChatStream(activeId!);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation, streamedContent]);

  // Select first conversation on load
  useEffect(() => {
    if (!activeId && conversations && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const handleSend = async () => {
    if (!input.trim() || !activeId) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  };

  const handleCreate = async () => {
    const newConvo = await createMutation.mutateAsync(`Session ${Math.floor(Math.random() * 1000)}`);
    setActiveId(newConvo.id);
  };

  return (
    <div className="flex h-full gap-4 text-sm font-mono">
      {/* Sidebar */}
      <div className="w-1/3 flex flex-col border-r border-primary/20 pr-4">
        <Button 
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="mb-4 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          NEW SESSION
        </Button>
        
        <ScrollArea className="flex-1 pr-2">
          {loadingConvos ? (
             <div className="text-primary/50 text-center py-4">Scanning...</div>
          ) : (
            <div className="space-y-1">
              {conversations?.map((convo) => (
                <div
                  key={convo.id}
                  onClick={() => setActiveId(convo.id)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded cursor-pointer transition-colors group border border-transparent",
                    activeId === convo.id 
                      ? "bg-primary/10 border-primary/30 text-primary" 
                      : "hover:bg-white/5 hover:border-white/10 text-muted-foreground"
                  )}
                >
                  <span className="truncate">{convo.title || `Session ${convo.id}`}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(convo.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {conversations?.length === 0 && (
                <div className="text-muted-foreground text-center py-8 italic">
                  No active channels.
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto mb-4 space-y-4 p-2 custom-scrollbar">
          {!activeId ? (
            <div className="h-full flex flex-col items-center justify-center text-primary/30">
              <Cpu className="w-16 h-16 mb-4 animate-pulse" />
              <p>SELECT A CHANNEL TO BEGIN UPLINK</p>
            </div>
          ) : loadingActive ? (
            <div className="h-full flex items-center justify-center text-primary">
              <span className="animate-pulse">DECRYPTING STREAM...</span>
            </div>
          ) : (
            <>
              {activeConversation?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded border flex items-center justify-center shrink-0",
                    msg.role === "user" 
                      ? "bg-blue-500/10 border-blue-500/50 text-blue-400" 
                      : "bg-purple-500/10 border-purple-500/50 text-purple-400"
                  )}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                  </div>
                  
                  <div className={cn(
                    "p-3 rounded-lg border text-sm backdrop-blur-sm",
                    msg.role === "user" 
                      ? "bg-blue-500/5 border-blue-500/20 text-blue-100" 
                      : "bg-purple-500/5 border-purple-500/20 text-purple-100"
                  )}>
                    <div className="mb-1 text-[10px] opacity-50 uppercase tracking-wider">
                      {msg.role} • {format(new Date(msg.createdAt), "HH:mm:ss")}
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}

              {/* Streaming Content Bubble */}
              {isStreaming && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded border bg-purple-500/10 border-purple-500/50 text-purple-400 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div className="p-3 rounded-lg border bg-purple-500/5 border-purple-500/20 text-purple-100 backdrop-blur-sm">
                    <div className="mb-1 text-[10px] opacity-50 uppercase tracking-wider flex items-center gap-2">
                      ASSISTANT <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {streamedContent}
                      <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-pulse align-middle" />
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2 pt-2 border-t border-primary/20">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={activeId ? "Enter command or message..." : "Select a channel"}
            disabled={!activeId || isStreaming}
            className="bg-black/40 border-primary/30 text-primary placeholder:text-primary/30 focus-visible:ring-primary/50 font-mono"
            autoComplete="off"
          />
          <Button
            onClick={handleSend}
            disabled={!activeId || !input.trim() || isStreaming}
            className="bg-primary hover:bg-primary/80 text-black font-bold"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
