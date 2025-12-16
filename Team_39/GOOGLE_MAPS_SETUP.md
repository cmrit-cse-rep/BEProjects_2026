# Google Maps API Setup Guide for Vercel

## Current Error: "This page can't load Google Maps correctly"

This error typically occurs when the Google Maps API key is not properly configured for your Vercel domain.

## Step-by-Step Fix:

### 1. Check if API Key is Set in Vercel

1. Go to your Vercel dashboard
2. Select your project: `A-Gateless-Parking-Management-System`
3. Go to **Settings** → **Environment Variables**
4. Check if `NEXT_PUBLIC_MAPS_API_KEY` exists
5. If not, add it with your Google Maps API key

### 2. Verify API Key in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your API key and click to edit

### 3. Configure API Key Restrictions (CRITICAL)

#### Option A: Allow All Domains (Easiest for Development)

1. Under **Application restrictions**:
   - Select **None** (for development)
   - OR **HTTP referrers (web sites)**
   - Add these domains:
     ```
     localhost:3000
     localhost:3000/*
     *.vercel.app/*
     your-app-name.vercel.app/*
     your-custom-domain.com/*
     your-custom-domain.com/*
     ```

#### Option B: Restrict to Specific Domains (Recommended for Production)

1. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add referrers (one per line):
     ```
     https://your-app-name.vercel.app/*
     https://your-custom-domain.com/*
     ```
   - **Important:** Use `https://` for production

### 4. Enable Required APIs

Make sure these APIs are enabled in Google Cloud Console:

1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - ✅ **Maps JavaScript API** (required for maps)
   - ✅ **Places API** (required for autocomplete)
   - ✅ **Geocoding API** (optional, but recommended)

### 5. Set Up Billing (REQUIRED)

Google Maps API requires billing to be enabled:

1. Go to **Billing** in Google Cloud Console
2. Link a billing account
3. You get $200 free credit per month (usually enough for small apps)

### 6. Verify API Key Permissions

In your API key settings, under **API restrictions**:
- Select **Don't restrict key** (for development)
- OR select **Restrict key** and choose:
  - Maps JavaScript API
  - Places API
  - Geocoding API (optional)

### 7. Test the API Key

After configuring:
1. Save changes in Google Cloud Console
2. Wait 5-10 minutes for changes to propagate
3. Redeploy on Vercel (or push new commit)
4. Check the site again

## Common Issues:

### Issue: API Key works locally but not on Vercel
**Solution:** Add your Vercel domain to HTTP referrer restrictions:
```
*.vercel.app/*
your-app-name.vercel.app/*
```

### Issue: "Billing not enabled"
**Solution:** Enable billing in Google Cloud Console (free $200 credit/month)

### Issue: "API not enabled"
**Solution:** Enable Maps JavaScript API and Places API in Google Cloud Console

### Issue: API key restricted to localhost
**Solution:** Update HTTP referrer restrictions to include Vercel domains

## Quick Checklist:

- [ ] API key added to Vercel environment variables
- [ ] Maps JavaScript API enabled
- [ ] Places API enabled
- [ ] Billing account linked
- [ ] HTTP referrer restrictions include Vercel domains
- [ ] API restrictions allow Maps JavaScript API and Places API
- [ ] Changes saved and propagated (wait 5-10 minutes)

## Environment Variable Format in Vercel:

```
Name: NEXT_PUBLIC_MAPS_API_KEY
Value: AIzaSy... (your actual API key)
Environment: Production, Preview, Development (select all)
```

## Test After Fixing:

1. Check browser console for API errors
2. Verify map loads without error dialog
3. Test autocomplete functionality
4. Verify markers appear on map

