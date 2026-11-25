/// <reference types="vite/client" />

interface Window {
  // Pendo agent, loaded by the Pendo install snippet. Absent when Pendo isn't installed.
  pendo?: {
    trackAgent?: (eventType: "prompt" | "agent_response" | "user_reaction", metadata: object) => void;
  };
}
