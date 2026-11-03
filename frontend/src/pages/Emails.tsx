import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Mail } from "lucide-react";
import api from "../lib/api";

interface Email {
  id: string;
  recipient: string;
  subject: string;
  status: string;
  createdAt?: string;
}

export default function Emails() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const { data: emails = [], isLoading, isError } = useQuery({
    queryKey: ["emails"],
    queryFn: async () => {
      const res = await api.get("/emails");
      return res.data.data ?? res.data;
    },
  });

  const filtered = useMemo(() => {
    return emails.filter((email: Email) => {
      const matchesSearch =
        email.recipient?.toLowerCase().includes(search.toLowerCase()) ||
        email.subject?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        status === "ALL" || email.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [emails, search, status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emails</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track all scheduled, sent and failed emails.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by recipient or subject..."
            className="w-full rounded-lg border bg-card py-2 pl-10 pr-3 text-sm"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border bg-card px-3 py-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {isLoading ? (
          <p className="p-8 text-center">Loading emails...</p>
        ) : isError ? (
          <p className="p-8 text-center text-destructive">
            Unable to load emails.
          </p>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="mx-auto mb-3 text-muted-foreground" size={32} />
            <p className="font-medium">No emails found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((email: Email) => (
                  <tr key={email.id}>
                    <td className="p-4">{email.recipient}</td>
                    <td className="p-4 font-medium">{email.subject}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs">
                        {email.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {email.createdAt
                        ? new Date(email.createdAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}