import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Megaphone } from "lucide-react";
import api from "../lib/api";

interface Campaign {
  id: string;
  name: string;
  subject?: string;
  status: string;
  createdAt?: string;
}

export default function Campaigns() {
  const { data: campaigns = [], isLoading, isError } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await api.get("/campaigns");
      return res.data.data ?? res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create and manage your email campaigns.
          </p>
        </div>

        <Link
          to="/campaigns/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          <Plus size={17} /> Create Campaign
        </Link>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">All Campaigns</h2>
          <p className="text-sm text-muted-foreground">
            {campaigns.length} campaigns
          </p>
        </div>

        {isLoading ? (
          <p className="p-8 text-center">Loading campaigns...</p>
        ) : isError ? (
          <p className="p-8 text-center text-destructive">
            Unable to load campaigns. Check your backend.
          </p>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="mx-auto mb-3 text-muted-foreground" size={35} />
            <p className="font-medium">No campaigns yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first email campaign.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-4">Campaign</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {campaigns.map((campaign: Campaign) => (
                  <tr key={campaign.id}>
                    <td className="p-4 font-medium">{campaign.name}</td>
                    <td className="p-4">{campaign.subject || "—"}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs">
                        {campaign.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {campaign.createdAt
                        ? new Date(campaign.createdAt).toLocaleDateString()
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