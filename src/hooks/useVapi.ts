import { useState, useEffect, useCallback, useRef } from "react";
import Vapi from "@vapi-ai/web";
import { supabase } from "@/integrations/supabase/client";

interface UseVapiOptions {
  onTranscriptUpdate?: (transcript: string) => void;
  onCallEnd?: () => void;
  onError?: (error: Error) => void;
}

export const useVapi = (options: UseVapiOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [transcript, setTranscript] = useState("");

  const vapiRef = useRef<Vapi | null>(null);

  // Keep latest callbacks without re-initializing Vapi (prevents stale closures)
  const onTranscriptUpdateRef = useRef<UseVapiOptions["onTranscriptUpdate"]>(
    options.onTranscriptUpdate
  );
  const onCallEndRef = useRef<UseVapiOptions["onCallEnd"]>(options.onCallEnd);
  const onErrorRef = useRef<UseVapiOptions["onError"]>(options.onError);

  useEffect(() => {
    onTranscriptUpdateRef.current = options.onTranscriptUpdate;
    onCallEndRef.current = options.onCallEnd;
    onErrorRef.current = options.onError;
  }, [options.onTranscriptUpdate, options.onCallEnd, options.onError]);

  const initializeVapi = useCallback(async () => {
    if (vapiRef.current) return vapiRef.current;

    try {
      const { data, error } = await supabase.functions.invoke("get-vapi-key");

      if (error) {
        throw new Error(error.message || "Failed to get Vapi public key");
      }

      const publicKey = (data as any)?.publicKey as string | undefined;
      if (!publicKey) {
        throw new Error("Failed to get Vapi public key");
      }

      const vapi = new Vapi(publicKey);

      vapi.on("call-start", () => {
        console.log("Vapi call started");
        setIsConnected(true);
        setIsLoading(false);
      });

      // Optional: supported by newer SDKs; safe to ignore if never fired
      vapi.on?.("call-start-failed", (err: any) => {
        console.error("Vapi call start failed:", err);
        setIsLoading(false);
        onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
      });

      vapi.on("call-end", () => {
        console.log("Vapi call ended");
        setIsConnected(false);
        setIsSpeaking(false);
        onCallEndRef.current?.();
      });

      vapi.on("speech-start", () => {
        setIsSpeaking(true);
      });

      vapi.on("speech-end", () => {
        setIsSpeaking(false);
      });

      vapi.on("volume-level", (level: number) => {
        setVolumeLevel(level);
      });

      vapi.on("message", (message: any) => {
        if (message?.type === "transcript" && message?.transcriptType === "final") {
          setTranscript((prev) => {
            const next = (prev + " " + String(message.transcript || "")).trim();
            onTranscriptUpdateRef.current?.(next);
            return next;
          });
        }
      });

      vapi.on("error", (error: Error) => {
        console.error("Vapi error:", error);
        setIsLoading(false);
        onErrorRef.current?.(error);
      });

      vapiRef.current = vapi;
      return vapi;
    } catch (error) {
      console.error("Failed to initialize Vapi:", error);
      throw error;
    }
  }, []);

  const startCall = useCallback(
    async (assistantConfig: {
      name?: string;
      firstMessage: string;
      systemPrompt: string;
      questions: string[];
    }) => {
      setIsLoading(true);
      setTranscript("");

      try {
        const vapi = await initializeVapi();
        if (!vapi) throw new Error("Failed to initialize Vapi");

        const questionsText = assistantConfig.questions
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n");

        console.log("Starting Vapi call", {
          questionsCount: assistantConfig.questions.length,
        });

        await vapi.start({
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en",
          },
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `${assistantConfig.systemPrompt}\n\nHere are the interview questions you must ask one by one:\n${questionsText}\n\nInstructions:\n- Ask each question one at a time\n- Wait for the candidate's complete response before moving to the next question\n- Provide brief acknowledgment of their answers\n- Keep a professional and friendly tone\n- After all questions are answered, thank them and end the interview\n- Do NOT end the call prematurely - always wait for the candidate to finish speaking`,
              },
            ],
          },
          voice: {
            provider: "11labs",
            voiceId: "21m00Tcm4TlvDq8ikWAM",
          },
          firstMessage: assistantConfig.firstMessage,
          maxDurationSeconds: 1800,
        });
      } catch (error) {
        console.error("Failed to start Vapi call:", error);
        setIsLoading(false);
        onErrorRef.current?.(error as Error);
      }
    },
    [initializeVapi]
  );

  const endCall = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      setIsConnected(false);
      setIsSpeaking(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  return {
    isConnected,
    isLoading,
    isSpeaking,
    volumeLevel,
    transcript,
    startCall,
    endCall,
  };
};
