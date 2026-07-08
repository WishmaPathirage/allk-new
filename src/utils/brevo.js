const BREVO_API_KEY = process.env.REACT_APP_BREVO_API_KEY;
const SENDER_NAME  = 'A/L.lk';
const SENDER_EMAIL = process.env.REACT_APP_BREVO_SENDER_EMAIL;

export async function sendEmail({ to, toName = '', subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Brevo error ${res.status}`);
  }
  return res.json();
}
