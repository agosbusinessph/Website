# Agos website: Vercel setup

```
agos-website/
├── index.html        the website
└── api/contact.js    sends contact form submissions by email
```

## 1. Create a Resend account
1. Sign up at resend.com with the team email.
2. Go to **API Keys** and create a key with "Sending access". Copy it somewhere safe.
3. For live use, go to **Domains** and add the Agos domain. Resend will give you DNS records to add at your domain registrar.

Until the domain is verified, you can test with the sender `onboarding@resend.dev`. In test mode, Resend only delivers to the email address you signed up with.

## 2. Deploy to Vercel
1. Put this folder in a GitHub repo and import it in Vercel. You can also run `vercel` from inside the folder with the Vercel CLI.
2. No build settings are needed. Leave the framework as "Other".

## 3. Add environment variables
In Vercel, go to **Project > Settings > Environment Variables** and add:

| Name | Example |
|---|---|
| `RESEND_API_KEY` | `re_...` (from step 1) |
| `CONTACT_TO_EMAIL` | `hello@agosdomain.com` (where inquiries go) |
| `CONTACT_FROM_EMAIL` | `Agos Website <website@agosdomain.com>` |

For testing, use `Agos Website <onboarding@resend.dev>` as the sender and your Resend signup email as the recipient.

Redeploy after adding or changing variables, because they only apply to new deployments.

## 4. Test
Open the live site, fill in the form, and click **Let's talk**. You should see "Thanks! We got your message..." and receive an email. Hitting Reply in the email replies straight to the visitor.

If something fails, check **Vercel > Project > Logs** for "Resend error" details.

## Notes
- The API key lives only in Vercel's settings, never in the code.
- A hidden "honeypot" field quietly blocks simple spam bots.
- The form only works on the deployed Vercel site. It won't send when you open index.html directly from your computer.
