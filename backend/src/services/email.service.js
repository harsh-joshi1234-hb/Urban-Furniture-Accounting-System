const nodemailer = require('nodemailer');
const env = require('../config/env');

/**
 * SMTP delivery.
 *
 * The transporter is created lazily and reused, so a misconfigured or
 * unreachable mail server never stops the API from booting. When SMTP is not
 * configured the service degrades to logging the message (development mode)
 * instead of throwing - callers such as forgot-password must stay responsive
 * and must not leak whether an account exists.
 */

let transporter = null;

/** SMTP is considered configured once a host is present. */
const isConfigured = () => Boolean(env.SMTP_HOST);

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (transporter) return transporter;

  const port = Number(env.SMTP_PORT) || 587;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    // Implicit TLS on 465; STARTTLS upgrade on 587/25.
    secure: env.SMTP_SECURE !== undefined ? env.SMTP_SECURE === 'true' : port === 465,
    ...(env.SMTP_USER
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
      : {}),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporter;
};

/** Verifies the SMTP connection. Used by the health check and tests. */
const verifyConnection = async () => {
  const mailer = getTransporter();
  if (!mailer) return { configured: false, ok: false, reason: 'SMTP is not configured' };
  try {
    await mailer.verify();
    return { configured: true, ok: true };
  } catch (error) {
    return { configured: true, ok: false, reason: error.message };
  }
};

/**
 * Sends one message.
 * Never throws - returns a result object so callers can decide what to log.
 */
const sendMail = async ({ to, subject, text, html }) => {
  const mailer = getTransporter();

  if (!mailer) {
    console.warn(
      `[email] SMTP not configured - message to ${to} was not sent. Subject: "${subject}"`,
    );
    if (env.NODE_ENV === 'development') {
      console.warn(`[email][dev preview]\n${text}`);
    }
    return { delivered: false, reason: 'SMTP is not configured' };
  }

  try {
    const info = await mailer.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    // Delivery problems must not surface to the caller as a request failure.
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error.message);
    return { delivered: false, reason: error.message };
  }
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Password reset email.
 * The link points at the frontend reset page, which reads ?token= from the URL.
 */
const sendPasswordResetEmail = async ({ to, name, token, expiresAt }) => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const expiryText = expiresAt
    ? `This link expires at ${new Date(expiresAt).toUTCString()}.`
    : 'This link expires in 1 hour.';

  const text = [
    greeting,
    '',
    `We received a request to reset the password for your ${env.APP_NAME} account.`,
    '',
    'Open this link to choose a new password:',
    resetUrl,
    '',
    `If the link does not work, paste this token into the reset page: ${token}`,
    '',
    expiryText,
    'If you did not request a password reset you can ignore this email - your password stays unchanged.',
    '',
    env.APP_NAME,
  ].join('\n');

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6;max-width:560px">
  <h2 style="margin:0 0 12px;font-size:18px">Reset your password</h2>
  <p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
  <p style="margin:0 0 16px">
    We received a request to reset the password for your ${escapeHtml(env.APP_NAME)} account.
  </p>
  <p style="margin:0 0 20px">
    <a href="${escapeHtml(resetUrl)}"
       style="background:#4f46e5;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">
      Choose a new password
    </a>
  </p>
  <p style="margin:0 0 8px;font-size:13px;color:#475569">
    If the button does not work, copy this link into your browser:
  </p>
  <p style="margin:0 0 16px;font-size:13px;word-break:break-all">
    <a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a>
  </p>
  <p style="margin:0 0 16px;font-size:13px;color:#475569">${escapeHtml(expiryText)}</p>
  <p style="margin:0;font-size:13px;color:#475569">
    If you did not request a password reset you can ignore this email - your password stays unchanged.
  </p>
</div>`.trim();

  return sendMail({
    to,
    subject: `Reset your ${env.APP_NAME} password`,
    text,
    html,
  });
};

/** Test seam - clears the cached transporter after env changes. */
const resetTransporter = () => {
  transporter = null;
};

module.exports = {
  isConfigured,
  verifyConnection,
  sendMail,
  sendPasswordResetEmail,
  resetTransporter,
};
