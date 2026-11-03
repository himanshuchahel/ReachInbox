import express from "express";
import cors from "cors";
import helmet from "helmet";

import campaignRoutes from "./routes/campaign.routes.js";
import senderRoutes from "./routes/sender.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import emailRoutes from "./routes/email.routes.js";
import authRoutes from "./routes/auth.routes.js";
import searchRoutes from "./routes/search.routes.js";
import slackRoutes from "./routes/slack.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/campaigns", campaignRoutes);
app.use("/api/senders", senderRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/slack", slackRoutes);

app.get("/api/leads/test", (_req, res) => {
  res.json({ success: true, message: "Lead routes are working" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ReachInbox API is running",
    timestamp: new Date().toISOString(),
  });
});

export default app;