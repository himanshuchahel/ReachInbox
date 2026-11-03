
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Mail,
  Loader2,
  Send,
  X,
} from "lucide-react";
import api from "../lib/api";

interface SlackStatus {
  connected: boolean;
  teamName?: string;
  channelName?: string;
}

export default function Integrations() {
  const queryClient = useQueryClient();

  const [notification, setNotification] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<SlackStatus>({
    queryKey: ["slack-status"],
    queryFn: async () => {
      const res = await api.get("/slack/status");

      // Backend returns connected at the root and integration inside data.
      return {
        connected: Boolean(
          res.data.connected ?? res.data.data?.connected
        ),
        teamName: res.data.data?.teamName,
        channelName: res.data.data?.channelName,
      };
    },
    refetchOnWindowFocus: true,
  });

  const slack: SlackStatus = data ?? { connected: false };

  // Handle Slack OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slackStatus = params.get("slack");

    if (slackStatus === "connected") {
      setNotification("Slack workspace connected successfully!");

      queryClient.invalidateQueries({
        queryKey: ["slack-status"],
      });
    } else if (slackStatus) {
      setNotification(`Slack connection failed: ${slackStatus}`);
    }

    if (slackStatus) {
      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );
    }
  }, [queryClient]);

  const connectSlack = async () => {
    try {
      setConnecting(true);

      const res = await api.get("/slack/connect");
      const authUrl = res.data.authUrl;

      if (!authUrl) {
        throw new Error("Slack authorization URL not received");
      }

      window.location.assign(authUrl);
    } catch (error) {
      console.error("Slack connection error:", error);
      setNotification("Unable to connect Slack. Please try again.");
      setConnecting(false);
    }
  };

  const testSlack = async () => {
    try {
      setTesting(true);

      await api.post("/slack/test");

      setNotification(
        "Test notification sent successfully! Check your Slack channel."
      );
    } catch (error) {
      console.error("Slack test error:", error);
      setNotification("Unable to send Slack notification.");
    } finally {
      setTesting(false);
    }
  };

  const integrations = [
    {
      name: "Google OAuth",
      description: "Securely authenticate using your Google account.",
      icon: Mail,
      connected: Boolean(localStorage.getItem("reachinbox_token")),
    },
    {
      name: "Slack",
      description: "Receive campaign and email delivery notifications.",
      icon: MessageSquare,
      connected: slack.connected,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your connected services and third-party integrations.
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            {notification}
          </div>

          <button
            onClick={() => setNotification("")}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss notification"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Integration cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {integrations.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.name}
              className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-muted p-3">
                  <Icon size={24} />
                </div>

                {item.connected && (
                  <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                    <CheckCircle2 size={15} />
                    Connected
                  </span>
                )}
              </div>

              <h2 className="mt-5 font-semibold">{item.name}</h2>

              <p className="mt-2 min-h-10 text-sm text-muted-foreground">
                {item.description}
              </p>

              {item.name === "Slack" ? (
                <div className="mt-5">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 size={16} className="animate-spin" />
                      Checking connection...
                    </div>
                  ) : isError ? (
                    <button
                      onClick={() => refetch()}
                      className="text-sm text-primary underline"
                    >
                      Unable to check status. Retry
                    </button>
                  ) : slack.connected ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={testSlack}
                          disabled={testing}
                          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                        >
                          {testing ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Send size={15} />
                          )}
                          {testing ? "Sending..." : "Send Test"}
                        </button>

                        <span className="text-xs text-green-600">
                          <CheckCircle2 size={14} className="mr-1 inline" />
                          Integration Active
                        </span>
                      </div>

                      <div className="rounded-lg bg-muted/50 p-3 text-sm">
                        <p className="font-medium">
                          {slack.teamName || "Slack Workspace"}
                        </p>

                        {slack.channelName && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Channel: #{slack.channelName}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-muted-foreground">
                          Your Slack workspace is connected to ReachInbox.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={connectSlack}
                      disabled={connecting}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                    >
                      {connecting ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <ExternalLink size={15} />
                      )}
                      {connecting ? "Connecting..." : "Connect Slack"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="mt-5 text-xs text-muted-foreground">
                  {item.connected
                    ? "Authentication is active."
                    : "Not connected"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
