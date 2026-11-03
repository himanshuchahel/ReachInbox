import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Mail } from "lucide-react";
import api from "../lib/api";

interface EmailResult {
  id: string;
  recipient: string;
  subject: string;
  body?: string;
  status: string;
}

export default function Search() {
  const [query, setQuery] = useState("");

  const { data, isFetching, isError } = useQuery({
    queryKey: ["email-search", query],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const res = await api.get("/search", {
        params: { q: query },
      });

      const result = res.data.data ?? res.data;
      return Array.isArray(result) ? result : result.results ?? [];
    },
  });

  const results: EmailResult[] = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Search Emails</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search email content, subjects and recipients using Elasticsearch.
        </p>
      </div>

      <div className="relative">
        <SearchIcon
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emails..."
          className="w-full rounded-xl border bg-card py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isFetching && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Search failed. Please check Elasticsearch and the backend.
        </p>
      )}

      {query.trim().length < 2 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <SearchIcon className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="font-medium">Search your emails</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter at least two characters to begin.
          </p>
        </div>
      ) : !isFetching && results.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Mail className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="font-medium">No matching emails</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another keyword.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((email) => (
            <div key={email.id} className="rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">{email.subject}</p>
                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  {email.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                To: {email.recipient}
              </p>

              {email.body && (
                <p className="mt-3 line-clamp-3 text-sm">{email.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}