// lib/inngest/client.ts
import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "financex-ai",
  name: "financex-ai",
  retry: {
    maxAttempts: 2,
    strategy: "exponential", // optional, "constant" or "exponential"
  },
});
