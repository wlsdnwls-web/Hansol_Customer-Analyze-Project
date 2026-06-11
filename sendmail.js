const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { to, subject, html, smtpEmail, smtpPassword } = req.body || {};

  if (!to || !smtpEmail || !smtpPassword || !subject || !html) {
    return res.status(400).json({ error: '필수 항목 누락 (to, subject, html, smtpEmail, smtpPassword)' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpEmail, pass: smtpPassword },
  });

  try {
    await transporter.sendMail({
      from: `"SubliSales" <${smtpEmail}>`,
      to,
      subject,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
