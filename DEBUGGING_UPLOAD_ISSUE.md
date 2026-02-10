# Debugging Image Upload Issue

## Issue

When uploading an image in the "Upload Your Bathroom Photo" stage on Vercel, nothing happens after selecting the image.

## Changes Made

### 1. Enhanced Logging

Added comprehensive console logging throughout the upload flow:

- **Frontend** (`GatsbyGlassVisualizer.tsx`): Logs file selection, validation steps, API calls
- **API Route** (`validate-image/route.ts`): Logs request processing, validation, errors
- **Gemini Handler** (`gemini.ts`): Logs API interactions with Gemini

### 2. Better Error Handling

- Added visible error messages in the upload UI
- Added alert popup for critical errors
- Improved error messages to be more descriptive

### 3. Error Display

- Added error prop to `PhotoUploadStep` component
- Errors now display in a red banner above the upload area

## How to Debug on Vercel

### Step 1: Check Browser Console

1. Open the app in Vercel
2. Open browser DevTools (F12 or right-click → Inspect)
3. Go to the Console tab
4. Try uploading an image
5. Look for logs starting with `[FILE UPLOAD]` or `[VALIDATE-IMAGE API]`

### Step 2: Check Vercel Logs

1. Go to your Vercel dashboard
2. Select your deployment
3. Click on the "Functions" tab
4. Look for the `api/validate-image` function
5. Check the real-time logs for any errors

### Step 3: Verify Environment Variables

**CRITICAL**: Ensure these environment variables are set in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check that `GEMINI_API_KEY` is set:
   - Name: `GEMINI_API_KEY`
   - Value: Your actual Gemini API key
   - Environments: Production, Preview, Development

**If the API key is missing, the upload will fail silently!**

### Step 4: Check API Key Validity

1. Verify your Gemini API key is active at: <https://aistudio.google.com/apikey>
2. Make sure it has permissions for:
   - `gemini-2.5-flash` model
   - Image analysis capabilities

### Step 5: Test Locally

To compare behavior, test locally:

```bash
cd apps/gatsby-glass
pnpm install
pnpm dev
```

Then try uploading an image and check the console logs.

## Common Issues and Solutions

### Issue 1: No logs appear in console

**Cause**: JavaScript error preventing code execution
**Solution**: Check browser console for any red error messages

### Issue 2: "Server configuration error"

**Cause**: Missing `GEMINI_API_KEY` environment variable
**Solution**: Add the environment variable in Vercel settings and redeploy

### Issue 3: "Unable to verify image content"

**Cause**: Gemini API error or invalid API key
**Solution**:

- Check Vercel function logs for detailed error
- Verify API key is correct and active
- Check if API quota is exceeded

### Issue 4: File input not triggering

**Cause**: Browser or mobile device issue with hidden file input
**Solution**: Added logging to detect if file selection even occurs

### Issue 5: Request timeout

**Cause**: Large image file or slow API response
**Solution**:

- Try with a smaller image (< 2MB)
- Check Vercel function timeout settings (default: 10s for hobby, 60s for pro)

## Expected Log Flow

When everything works correctly, you should see:

```
[FILE UPLOAD] File selected: bathroom.jpg 2048576 image/jpeg
[FILE UPLOAD] Starting validation for: target
[FILE UPLOAD] Converting to base64...
[FILE UPLOAD] Base64 conversion complete, data length: 2731234
[FILE UPLOAD] Calling validation API...
[VALIDATE-IMAGE API] Request received
[VALIDATE-IMAGE API] Body parsed
[VALIDATE-IMAGE API] Schema validation passed
[VALIDATE-IMAGE API] Starting Gemini validation...
[GEMINI validateImage] Starting validation
[GEMINI validateImage] Calling Gemini API...
[GEMINI validateImage] API response received
[VALIDATE-IMAGE API] Validation result: {"valid":true,"shape":"standard"}
[FILE UPLOAD] API response status: 200
[FILE UPLOAD] Validation successful, shape detected: standard
[FILE UPLOAD] Auto-advancing to next step...
```

## Quick Fix Commands

If you need to redeploy with the changes:

```bash
# Commit changes
git add .
git commit -m "Add comprehensive logging and error handling for image upload"
git push

# Vercel will auto-deploy if connected to GitHub
```

## Contact Support

If the issue persists after checking all of the above:

1. Export the browser console logs (right-click in console → Save as...)
2. Export the Vercel function logs
3. Share both logs for further investigation
