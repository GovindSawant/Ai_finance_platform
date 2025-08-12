import { inngest } from "@/lib/inngest/client";

export async function POST() {
  await inngest.send({
    name: "test/hello.world",
    data: {
      email: "demo@example.com",
    },
  });

  return new Response("Event sent");
}
