import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { toast } from "../components/ui/use-toast";

export default function DevChatTest() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string>("");

  const run = async () => {
    setRunning(true);
    setResult("");
    try {
      const seed = await (window as any).api(`admin/dev/seed-chat`, {
        method: "POST",
      });
      if (!seed.success) {
        toast({
          title: "Seed failed",
          description: seed.error || "Unknown error",
          variant: "destructive",
        });
        setRunning(false);
        return;
      }
      const conversationId =
        seed.data?.conversationId || seed.json?.conversationId;
      if (!conversationId) {
        toast({ title: "No conversationId returned" });
        setRunning(false);
        return;
      }

      const send = await (window as any).api(
        `conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: { text: "ping" },
        },
      );
      if (!send.success) {
        toast({
          title: "Send failed",
          description: send.error || "Unknown error",
          variant: "destructive",
        });
        setRunning(false);
        return;
      }

      // Ask server to simulate owner reply (admin-only)
      const reply = await (window as any).api(
        `admin/dev/reply-as-owner/${conversationId}`,
        { method: "POST" },
      );
      if (!reply.success) {
        toast({
          title: "Owner reply failed",
          description: reply.error || "Unknown error",
          variant: "destructive",
        });
        setRunning(false);
        return;
      }

      // Verify both messages within ~2s
      const start = Date.now();
      let okPing = false,
        okPong = false;
      while (Date.now() - start < 2000) {
        const msgs = await (window as any).api(
          `conversations/${conversationId}/messages`,
        );
        if (msgs.success) {
          const texts = (msgs.data || []).map((m: any) => m.text || m.message);
          okPing = texts.includes("ping");
          okPong = texts.includes("pong");
          if (okPing && okPong) break;
        }
        await new Promise((r) => setTimeout(r, 250));
      }

      if (okPing && okPong) {
        setResult("PASS");
        toast({ title: "PASS", description: `Conversation ${conversationId}` });
      } else {
        setResult("FAIL");
        toast({
          title: "FAIL",
          description: "Messages not verified",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Dev Chat Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={run}
              disabled={running}
              className="bg-[#C70000] hover:bg-[#A60000]"
            >
              {running ? "Running..." : "Run Seed + Ping/Pong"}
            </Button>
            {result && (
              <div
                className={`p-3 rounded ${result === "PASS" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {result}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
