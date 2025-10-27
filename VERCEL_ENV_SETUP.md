# Vercel Environment Variables Setup

You need to add these environment variables to your Vercel project:

## Environment Variables Page

Navigate to <https://vercel.com/dashboard> → Your Project → Settings → Environment Variables

### Required Variables

1. **NEXTAUTH_URL** = `https://saifmasr.vercel.app`
2. **NEXTAUTH_SECRET** = `mcnEaCyhXf4Hz38IHYx7IDq8hyUvSB6HBIPNYjctVRI=`
3. **DATABASE_URL** = `postgresql://neondb_owner:npg_vV6f4JpiOTld@ep-dry-base-ae31im2a-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. **NEXT_PUBLIC_STACK_PROJECT_ID** = `d39a106a-b975-4b01-9a47-f731c01cc8aa`
5. **NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY** = `pck_k7j0pj65mjds4ffwdjr06ng8wc441375z3bn0h6za3rq0`
6. **STACK_SECRET_SERVER_KEY** = `ssk_rs193frvrj7dv91d25shpexxm7h7drmyq7yws9cn3s9h0`

### Steps

1. Go to your Vercel dashboard
2. Select your project "saifmasr"
3. Go to Settings → Environment Variables
4. Add each variable above
5. Redeploy your application

### Generate a new NEXTAUTH_SECRET

Run this command locally and use the output:

```bash
openssl rand -base64 32
```

Or use this online generator:

<https://generate-secret.vercel.app/32>
