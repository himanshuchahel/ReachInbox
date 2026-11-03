import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;
let etherealUser: string | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporter) {
    return transporter;
  }

  // Automatically generate Ethereal SMTP credentials
  const testAccount = await nodemailer.createTestAccount();

  etherealUser = testAccount.user;

  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  await transporter.verify();

  console.log("Ethereal SMTP connected successfully");

  return transporter;
}

interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(email: SendEmailInput) {
  const mailer = await getTransporter();

  const info = await mailer.sendMail({
    from: `"ReachInbox" <${etherealUser}>`,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  console.log("Email sent successfully:", info.messageId);
  console.log("Ethereal preview:", previewUrl);

  return {
    messageId: info.messageId,
    previewUrl: typeof previewUrl === "string" ? previewUrl : null,
  };
}