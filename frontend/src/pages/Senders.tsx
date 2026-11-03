import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Mail, Power } from "lucide-react";
import api, { getError } from "../lib/api";

interface Sender {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
}

export default function Senders() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const { data: senders = [], isLoading } = useQuery({
    queryKey: ["senders"],
    queryFn: async () => {
      const res = await api.get("/senders");
      return res.data.data ?? res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/senders", { email, name }),
    onSuccess: () => {
      setEmail("");
      setName("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["senders"] });
    },
    onError: (err) => setError(getError(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/senders/${id}`, { isActive }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["senders"] }),
    onError: (err) => setError(getError(err)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Senders</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage the email sender accounts connected to ReachInbox.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          createMutation.mutate();
        }}
        className="grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-[1fr_1fr_auto]"
      >
        <input
          required
          type="email"
          placeholder="sender@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />

        <input
          placeholder="Sender name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />

        <button
          disabled={createMutation.isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          <Plus size={17} />
          Add Sender
        </button>

        {error && (
          <p className="text-sm text-destructive md:col-span-3">{error}</p>
        )}
      </form>

      <div className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">Connected Senders</h2>
          <p className="text-sm text-muted-foreground">
            {senders.length} sender accounts
          </p>
        </div>

        {isLoading ? (
          <p className="p-8 text-center">Loading senders...</p>
        ) : senders.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No senders added yet.
          </p>
        ) : (
          <div className="divide-y">
            {senders.map((sender: Sender) => (
              <div
                key={sender.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-3">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {sender.name || sender.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sender.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {sender.isActive ? "Active" : "Inactive"}
                  </span>

                  <button
                    onClick={() =>
                      toggleMutation.mutate({
                        id: sender.id,
                        isActive: !sender.isActive,
                      })
                    }
                    disabled={toggleMutation.isPending}
                    title="Toggle sender status"
                    className="rounded-lg border p-2 hover:bg-muted"
                  >
                    <Power size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}