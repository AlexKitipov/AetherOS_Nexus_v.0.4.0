import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes"; // Assuming this export exists based on context
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

// Types derived from schema
export type Conversation = {
  id: number;
  title: string;
  createdAt: string; // JSON dates are strings
};

export type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ConversationDetail = Conversation & { messages: Message[] };

// --- REST HOOKS ---

export function useConversations() {
  return useQuery({
    queryKey: [api.chat.listConversations.path],
    queryFn: async () => {
      const res = await fetch(api.chat.listConversations.path);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return await res.json() as Conversation[];
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: [api.chat.getConversation.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const url = buildUrl(api.chat.getConversation.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return await res.json() as ConversationDetail;
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (title?: string) => {
      const res = await fetch(api.chat.createConversation.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return await res.json() as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chat.listConversations.path] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new chat session",
        variant: "destructive",
      });
    }
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.chat.deleteConversation.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chat.listConversations.path] });
      toast({ title: "Deleted", description: "Conversation terminated." });
    },
  });
}

// --- STREAMING HOOK ---

export function useChatStream(conversationId: number) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setIsStreaming(true);
    setStreamedContent("");
    
    // Optimistically update UI or just let the stream handle it?
    // For simplicity, we'll rely on invalidating the query to show user message immediately
    // effectively, we might want to manually insert the user message into cache here.
    
    try {
      // 1. Send the message (this triggers the backend to start streaming)
      const url = buildUrl(api.chat.sendMessage.path, { id: conversationId });
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        // Backend sends "data: { ... }\n\n"
        const lines = chunk.split("\n\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6);
              if (jsonStr.trim() === "[DONE]" || jsonStr.includes(`"done":true`)) {
                // Stream finished
                continue;
              }
              const data = JSON.parse(jsonStr);
              if (data.content) {
                setStreamedContent(prev => prev + data.content);
              }
            } catch (e) {
              console.error("Error parsing stream chunk", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsStreaming(false);
      // Invalidate to fetch the full saved message from DB and sync state
      queryClient.invalidateQueries({ queryKey: [api.chat.getConversation.path, conversationId] });
      setStreamedContent(""); 
    }
  }, [conversationId, queryClient]);

  return { sendMessage, isStreaming, streamedContent };
}
