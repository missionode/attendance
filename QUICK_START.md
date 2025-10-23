# Quick Start Guide

Get your attendance system running in 15 minutes!

## Prerequisites
- Google account
- GitHub account

## 3-Step Setup

### Step 1: Google Apps Script (5 minutes)

1. Create a [new Google Sheet](https://sheets.google.com)
2. Create 3 sheets: `batches`, `students`, `attendance`
3. Go to Extensions > Apps Script
4. Copy code from `backend/Code.gs`
5. Deploy > New deployment > Web app > Anyone can access
6. Copy the Web App URL

### Step 2: Google OAuth (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. APIs & Services > Credentials
4. Create OAuth Client ID > Web application
5. Add authorized origins: `http://localhost`, `https://yourusername.github.io`
6. Copy the Client ID

### Step 3: Configure & Deploy (5 minutes)

1. Open `assets/js/config.js`
   - Update `API_BASE_URL` with Apps Script URL
   - Update `GOOGLE_CLIENT_ID` with OAuth Client ID

2. Update `student/enroll.html` and `student/attend.html`
   - Replace `YOUR_GOOGLE_CLIENT_ID` with your Client ID

3. Deploy to GitHub Pages:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/attendance.git
   git push -u origin main
   ```

4. Enable GitHub Pages in repository settings

## Test It Out

1. Visit: `https://yourusername.github.io/attendance/admin/index.html`
2. Click "Enroll Batch" > Create a batch
3. Scan the QR code (or open the URL)
4. Sign in with Google
5. Complete enrollment
6. View attendance on the calendar!

## Need Help?

See `SETUP_GUIDE.md` for detailed instructions.

## Common Issues

**Google Sign-In not working?**
- Check Client ID is correct
- Verify authorized origins include your domain

**API calls failing?**
- Verify Apps Script URL is correct
- Check deployment is set to "Anyone" access

**QR codes not showing?**
- Batch needs to be created first
- Check browser console for errors
