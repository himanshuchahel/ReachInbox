import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Mail,
  Send,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";

interface Email {
  id: string;
  recipient: string;
  subject: string;
  status: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
}

export default function Dashboard() {
  const { data: emails = [] } = useQuery({
    queryKey: ["emails"],
    queryFn: async () => {
      const res = await api.get("/emails");
      return res.data.data ?? res.data;
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await api.get("/campaigns");
      return res.data.data ?? res.data;
    },
  });

  const stats = [
    {
      title: "Total Emails",
      value: emails.length,
      icon: Mail,
    },
    {
      title: "Sent",
      value: emails.filter((e: Email) => e.status === "SENT").length,
      icon: Send,
    },
    {
      title: "Scheduled",
      value: emails.filter((e: Email) => e.status === "SCHEDULED").length,
      icon: Clock,
    },
    {
      title: "Failed",
      value: emails.filter((e: Email) => e.status === "FAILED").length,
      icon: AlertCircle,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor your email campaigns and delivery activity.
          </p>
        </div>

        <Link
          to="/campaigns/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus size={17} /> New Campaign
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {stat.title}
                </p>
                <Icon size={19} className="text-muted-foreground" />
              </div>

              <p className="mt-4 text-3xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-semibold">Recent Emails</h2>
              <p className="text-sm text-muted-foreground">
                Latest email activity
              </p>
            </div>

            <Link to="/emails" className="text-sm text-primary">
              View all
            </Link>
          </div>

          <div className="divide-y">
            {emails.slice(0, 6).map((email: Email) => (
              <div
                key={email.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {email.subject}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {email.recipient}
                  </p>
                </div>

                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  {email.status}
                </span>
              </div>
            ))}

            {emails.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No emails yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-semibold">Campaigns</h2>
              <p className="text-sm text-muted-foreground">
                Your recent campaigns
              </p>
            </div>

            <Link to="/campaigns" className="text-sm text-primary">
              View all
            </Link>
          </div>

          <div className="divide-y">
            {campaigns.slice(0, 6).map((campaign: Campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4"
              >
                <p className="text-sm font-medium">{campaign.name}</p>
                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  {campaign.status}
                </span>
              </div>
            ))}

            {campaigns.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No campaigns created.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3 rounded-xl border bg-card p-5">
        <Activity className="text-primary" />
        <div>
          <p className="font-medium">ReachInbox is ready</p>
          <p className="text-sm text-muted-foreground">
            Create a campaign and start scheduling your emails.
          </p>
        </div>
      </div>
    </div>
  );
}