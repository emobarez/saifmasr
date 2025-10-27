# Vercel Deployment

## Environment Variables

Before deploying to Vercel, make sure to set up the following environment variables in your Vercel dashboard:

### Required Environment Variables:
- `NEXTAUTH_URL` - Your deployment URL (will be provided by Vercel)
- `NEXTAUTH_SECRET` - A random secret key for NextAuth.js
- `DATABASE_URL` - Your Neon PostgreSQL connection string

### Optional Environment Variables:
- `GOOGLE_GENERATIVE_AI_API_KEY` - For AI features
- Any other custom environment variables used in your application

## Deployment Steps:

1. Install Vercel CLI globally: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy: `vercel --prod`

## Database Setup:

Make sure your Neon PostgreSQL database is set up and the connection string is added to Vercel environment variables.

## Post-Deployment:

After deployment, update your `NEXTAUTH_URL` environment variable with the actual Vercel deployment URL.