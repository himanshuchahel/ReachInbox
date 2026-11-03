import { sendEmail } from "./services/email.service.js";

async function testEmail() {
  try {
    const result = await sendEmail({
      to: "test@example.com",
      subject: "ReachInbox SMTP Test",
      text: "Hello! This is a test email from ReachInbox.",
      html: "<h2>Hello!</h2><p>ReachInbox SMTP integration is working.</p>",
    });

    console.log("SMTP Test Successful!");
    console.log("Message ID:", result.messageId);
    console.log("Preview URL:", result.previewUrl);
  } catch (error) {
    console.error("SMTP Test Failed:", error);
  }
}

void testEmail();