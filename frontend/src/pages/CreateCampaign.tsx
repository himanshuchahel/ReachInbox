
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Send } from "lucide-react";
import api, { getError } from "../lib/api";

interface Sender {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
}

function extractEmails(content: string): string[] {
  const matches = content.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  ) ?? [];

  return [...new Set(matches.map((email) => email.toLowerCase()))];
}

export default function CreateCampaign() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [senderId, setSenderId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const { data: senders = [] } = useQuery<Sender[]>({
    queryKey: ["senders"],
    queryFn: async () => {
      const res = await api.get("/senders");
      return res.data.data ?? [];
    },
  });

  const activeSenders = senders.filter((sender) => sender.isActive);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("Please upload a CSV or TXT recipient file.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must not exceed 5 MB.");
      }

      const extension = file.name.split(".").pop()?.toLowerCase();

      if (!["csv", "txt"].includes(extension ?? "")) {
        throw new Error("Only CSV and TXT files are supported.");
      }

      const selectedSenderId =
        senderId || activeSenders[0]?.id;

      if (!selectedSenderId) {
        throw new Error("Please add an active sender first.");
      }

      const content = await file.text();
      const recipients = extractEmails(content);

      if (recipients.length === 0) {
        throw new Error("No valid email addresses found in the uploaded file.");
      }

      if (recipients.length > 5000) {
        throw new Error("Maximum 5000 recipients are allowed.");
      }

      const startAt = scheduledAt
        ? new Date(scheduledAt).toISOString()
        : new Date().toISOString();

      if (Number.isNaN(new Date(startAt).getTime())) {
        throw new Error("Invalid schedule date and time.");
      }

      if (new Date(startAt).getTime() < Date.now() - 60000) {
        throw new Error("Schedule date cannot be in the past.");
      }

      const response = await api.post("/campaigns", {
        senderId: selectedSenderId,
        subject: subject.trim(),
        body: body.trim(),
        recipients,
        startAt,
      });

      return response.data.data ?? response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email-stats"] });
      navigate("/campaigns");
    },

    onError: (err) => {
      setError(getError(err));
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => navigate("/campaigns")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back to campaigns
      </button>

      <div>
        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure your email and upload your recipient list.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          mutation.mutate();
        }}
        className="space-y-6 rounded-xl border bg-card p-6"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Campaign Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="November product launch"
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
          <p className="text-xs text-muted-foreground">
            Campaign names are currently not stored by the backend.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email Subject</label>
          <input
            required
            maxLength={998}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your subject line"
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email Body</label>
          <textarea
            required
            rows={7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email content..."
            className="w-full resize-y rounded-lg border bg-background px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sender</label>
          <select
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2"
          >
            <option value="">Default sender</option>
            {activeSenders.map((sender) => (
              <option key={sender.id} value={sender.id}>
                {sender.name || sender.email} ({sender.email})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Schedule Date & Time (optional)
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date(
              Date.now() - new Date().getTimezoneOffset() * 60000
            )
              .toISOString()
              .slice(0, 16)}
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to start sending immediately.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Recipients CSV / TXT
          </label>

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center hover:bg-muted/40">
            <Upload size={24} className="text-muted-foreground" />

            <span className="text-sm font-medium">
              {file ? file.name : "Click to upload recipient list"}
            </span>

            <span className="text-xs text-muted-foreground">
              CSV or TXT, maximum 5 MB, up to 5000 recipients
            </span>

            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setError("");
              }}
            />
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
        >
          <Send size={17} />
          {mutation.isPending ? "Creating..." : "Create Campaign"}
        </button>
      </form>
    </div>
  );
}
