# Cloudinary Setup for File Uploads on Vercel

## Overview
This application uses **Cloudinary** for file uploads when deployed on Vercel (serverless environment). For local development, files are saved to the local filesystem.

## Why Cloudinary?
- ✅ **Vercel Compatible**: Works perfectly with serverless functions
- ✅ **Free Tier**: 25GB storage, 25GB monthly bandwidth
- ✅ **Easy Setup**: No complex configuration needed
- ✅ **Reliable**: Industry-standard cloud storage
- ✅ **Auto-optimization**: Automatic image/file optimization

---

## Setup Instructions

### 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com/)
2. Click **Sign Up** (free account)
3. Verify your email

### 2. Get Your Credentials
After logging in:
1. Go to **Dashboard**
2. Find your credentials:
   - **Cloud Name**: `your-cloud-name`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz`

### 3. Create Upload Preset (Unsigned)
1. Go to **Settings** → **Upload**
2. Scroll to **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Signing Mode**: Select **Unsigned** ⚠️ (Important!)
   - **Preset name**: `saifmasr_uploads` (or any name you prefer)
   - **Folder**: `saifmasr-attachments` (optional but recommended)
   - **Resource type**: Keep as **Auto**
5. Click **Save**
6. Copy the **preset name**

---

## Environment Variables

### For Local Development (.env.local)
Create or update `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_UPLOAD_PRESET=saifmasr_uploads

# Optional: Force Cloudinary in development (remove to use local filesystem)
# VERCEL=1
```

### For Vercel Deployment
1. Go to your Vercel project
2. Click **Settings** → **Environment Variables**
3. Add these variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `CLOUDINARY_CLOUD_NAME` | `your-cloud-name` | Production, Preview, Development |
| `CLOUDINARY_UPLOAD_PRESET` | `saifmasr_uploads` | Production, Preview, Development |

4. Click **Save**
5. **Redeploy** your application

---

## Testing Upload Functionality

### Test Locally
```bash
npm run dev
```

1. Login to the application
2. Go to **طلب خدمة الحارس الشخصي** (Bodyguard Request)
3. Try uploading a file
4. Check console for upload success/errors

### Test on Vercel
1. Deploy to Vercel
2. Open your production URL
3. Login and test file upload
4. Files should upload to Cloudinary

---

## Verification

### Check Cloudinary Dashboard
1. Login to [cloudinary.com](https://cloudinary.com/)
2. Go to **Media Library**
3. Look for folder: `saifmasr-attachments`
4. Your uploaded files should appear here

### Check Application
Uploaded file URLs will look like:
```
https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/saifmasr-attachments/file.pdf
```

---

## Troubleshooting

### Error: "Cloud storage not configured"
**Solution**: Add `CLOUDINARY_CLOUD_NAME` environment variable

### Error: "Upload preset must be unsigned"
**Solution**: 
1. Go to Cloudinary Settings → Upload
2. Edit your upload preset
3. Change **Signing Mode** to **Unsigned**
4. Save

### Error: "Upload failed: 401 Unauthorized"
**Solution**: 
- Check that upload preset name is correct
- Verify preset is set to **Unsigned**
- Regenerate the preset if needed

### Files not appearing in Cloudinary
**Solution**:
- Check Cloudinary dashboard → Media Library
- Look in `saifmasr-attachments` folder
- Check browser console for errors

### Local development still uses filesystem
**Solution**:
- Add `CLOUDINARY_CLOUD_NAME` to `.env.local` to force Cloudinary
- Or add `VERCEL=1` to `.env.local`

---

## File Size Limits
- **Maximum file size**: 25 MB per file
- Enforced both client-side and server-side
- Can be adjusted in `src/app/api/uploads/route.ts`

---

## Security Notes
- ✅ **Unsigned uploads** are safe when:
  - You restrict folder path (`saifmasr-attachments`)
  - You validate file types server-side
  - You use the upload preset to control settings
- ✅ All uploads require authentication (logged-in users only)
- ✅ File size limits prevent abuse

---

## Free Tier Limits (Cloudinary)
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25 credits/month
- **API calls**: Unlimited

If you exceed limits, consider:
1. Upgrade to paid plan (starts at $0.11/GB)
2. Implement file cleanup for old attachments
3. Optimize file sizes before upload

---

## Alternative Cloud Storage Options

If you prefer different providers, you can modify `src/app/api/uploads/route.ts`:

### AWS S3
- Install: `npm install @aws-sdk/client-s3`
- Requires: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`

### Azure Blob Storage
- Install: `npm install @azure/storage-blob`
- Requires: `AZURE_STORAGE_CONNECTION_STRING`

### Firebase Storage
- Install: `npm install firebase-admin`
- Requires: Firebase service account credentials

---

## Support
For issues with Cloudinary setup:
- Cloudinary Docs: https://cloudinary.com/documentation
- Support: https://support.cloudinary.com/

For application-specific issues:
- Check server logs in Vercel dashboard
- Check browser console for client-side errors
