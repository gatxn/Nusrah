This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Platforms & Services

External platforms this project currently depends on, what each is used for, and whether it costs money.

| Platform | Used for | Cost |
|---|---|---|
| **Namecheap hosting** (cPanel + Node.js Selector) | Runs the live production site (`nusrah-app` on `business168.web-hosting.com`) | Paid — hosting plan subscription |
| **Domain — nusrah.co.tz** | The site's web address | Paid — annual domain registration |
| **GitHub** ([gatxn/Nusrah](https://github.com/gatxn/Nusrah)) | Source code hosting / version control | Free |
| **Neon** (serverless Postgres) | The entire database — users, profiles, orders, messages, etc. | Free tier available; paid tiers for more storage/compute |
| **AzamPay** | Mobile money checkout (Airtel Money, Tigo Pesa, HaloPesa, Azam Pesa, M-Pesa) | Free to integrate; takes a transaction fee per real payment |
| **PayPal** | Card / PayPal-balance checkout | Free to integrate; takes a transaction fee per real payment |
| **Resend** | Sending OTP verification codes by email | Free tier (limited emails/month); paid plans for higher volume |
| **Agora** | Real-time voice and video calling between members | Free tier (some free minutes/month); paid usage-based pricing beyond that |
| **Claude Code (Anthropic)** | AI pair-programmer used to build, debug, and deploy this project | Covered by the Claude subscription/plan in use |

Not yet wired up: a real SMS provider for OTP (`SMS_PROVIDER` is currently empty in `.env` — email OTP via Resend is the only channel live today).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
