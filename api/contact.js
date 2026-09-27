// Agos contact form handler (Vercel serverless function)
// Sends each form submission to the team inbox using the Resend email API.
//
// Required environment variables (set in Vercel > Project > Settings > Environment Variables):
//   RESEND_API_KEY      your Resend API key (never paste it into this file)
//   CONTACT_TO_EMAIL    where submissions should go, e.g. hello@yourdomain.com
//   CONTACT_FROM_EMAIL  sender address on a domain verified in Resend,
//                       e.g. "Agos Website <website@yourdomain.com>"
//                       For testing only, you can use "Agos Website <onboarding@resend.dev>"

const MAX = { name: 100, company: 150, email: 200, notes: 2000 };

function clean(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    console.error('Contact form: missing environment variables');
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: real visitors never fill this hidden field. Pretend success for bots.
  if (clean(body.website, 200)) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(body.name, MAX.name);
  const company = clean(body.company, MAX.company);
  const email = clean(body.email, MAX.email);
  const notes = clean(body.notes, MAX.notes);

  if (!name || !company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Please fill in name, business name, and a valid email.' });
  }

  const text = [
    `Name: ${name}`,
    `Business: ${company}`,
    `Email: ${email}`,
    '',
    "What's slowing them down:",
    notes || '(not provided)',
  ].join('\n');

  const html = `
    <h2 style="font-family:Arial,sans-serif;color:#0E3A5B">New inquiry from the Agos website</h2>
    <table style="font-family:Arial,sans-serif;font-size:15px;color:#0E3A5B">
      <tr><td style="padding:4px 12px 4px 0"><b>Name</b></td><td>${escapeHtml(name)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0"><b>Business</b></td><td>${escapeHtml(company)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0"><b>Email</b></td><td>${escapeHtml(email)}</td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#0E3A5B"><b>What's slowing them down:</b><br>
    ${escapeHtml(notes || '(not provided)').replace(/\n/g, '<br>')}</p>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `New Agos inquiry: ${name} (${company})`,
        text,
        html,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('Resend error', r.status, detail);
      return res.status(502).json({ ok: false, error: 'Email could not be sent' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form error', err);
    return res.status(500).json({ ok: false, error: 'Email could not be sent' });
  }
};
