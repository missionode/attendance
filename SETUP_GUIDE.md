# Complete Setup Guide

This guide will walk you through setting up the entire Student Session Management System from scratch.

## Part 1: Google Apps Script Backend Setup

### Step 1: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create a new spreadsheet
3. Name it **"Student Attendance Database"**

### Step 2: Set Up Sheet Structure

You need to create 3 sheets with the exact names below:

#### Sheet 1: batches
1. Rename "Sheet1" to **batches**
2. Add the following headers in Row 1:
   - A1: `batchId`
   - B1: `batchName`
   - C1: `college`
   - D1: `createdDate`
   - E1: `enrollmentURL`
   - F1: `attendanceURL`
   - G1: `isActive`

#### Sheet 2: students
1. Create a new sheet (+ button at bottom)
2. Name it **students**
3. Add the following headers in Row 1:
   - A1: `studentId`
   - B1: `googleId`
   - C1: `name`
   - D1: `email`
   - E1: `college`
   - F1: `batchId`
   - G1: `photoURL`
   - H1: `enrolledDate`

#### Sheet 3: attendance
1. Create another new sheet
2. Name it **attendance**
3. Add the following headers in Row 1:
   - A1: `attendanceId`
   - B1: `studentId`
   - C1: `batchId`
   - D1: `date`
   - E1: `timestamp`
   - F1: `college`

### Step 3: Add Apps Script

1. In your spreadsheet, click **Extensions** > **Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of `backend/Code.gs` from this project
4. Paste it into the Apps Script editor
5. Click the **Save** icon (disk icon) or press `Cmd+S` (Mac) / `Ctrl+S` (Windows)
6. Name the project **"Attendance System Backend"**

### Step 4: Deploy as Web App

1. In Apps Script editor, click **Deploy** > **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure deployment:
   - **Description**: "Attendance API v1"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. Click **Authorize access**
7. Select your Google account
8. Click **Advanced** > **Go to Attendance System Backend (unsafe)**
9. Click **Allow**
10. **IMPORTANT**: Copy the **Web App URL** (it looks like: `https://script.google.com/macros/s/AKfycby.../exec`)
11. Save this URL - you'll need it for frontend configuration

## Part 2: Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a project** dropdown at the top
3. Click **New Project**
4. Enter project name: **"Student Attendance System"**
5. Click **Create**
6. Wait for project to be created (notification will appear)

### Step 2: Enable Google+ API

1. In your project, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it
4. Click **Enable**

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted to configure consent screen:
   - Click **Configure Consent Screen**
   - Select **External**
   - Click **Create**
   - Fill in:
     - App name: "Student Attendance System"
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - Skip Scopes (click **Save and Continue**)
   - Skip Test users (click **Save and Continue**)
   - Click **Back to Dashboard**

4. Now create OAuth Client ID:
   - Click **Create Credentials** > **OAuth client ID**
   - Application type: **Web application**
   - Name: "Attendance Web Client"
   - **Authorized JavaScript origins**:
     - Add: `http://localhost`
     - Add: `http://localhost:8000`
     - Add: `http://localhost:3000`
     - Add: `http://127.0.0.1`
     - (You'll add your GitHub Pages URL later)
   - **Authorized redirect URIs**: Leave empty for now
   - Click **Create**

5. **IMPORTANT**: Copy the **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
6. Save this Client ID - you'll need it for frontend configuration

## Part 3: Frontend Configuration

### Step 1: Update Config File

1. Open `assets/js/config.js`
2. Replace the following values:

```javascript
const CONFIG = {
    // Replace with your Apps Script Web App URL from Part 1, Step 4
    API_BASE_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',

    // Replace with your OAuth Client ID from Part 2, Step 3
    GOOGLE_CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',

    // Update this later with your GitHub Pages URL
    APP_URL: 'https://yourusername.github.io/attendance'
};
```

### Step 2: Update Student HTML Files

Update the Google Client ID in these files:

**In `student/enroll.html`** (around line 51):
```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
     data-callback="handleCredentialResponse">
</div>
```

**In `student/attend.html`** (around line 53):
```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
     data-callback="handleCredentialResponse">
</div>
```

Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID.

### Step 3: Update Apps Script with Frontend URL

1. Go back to your Apps Script editor
2. Find line 99 in `Code.gs`:
   ```javascript
   const enrollmentURL = `YOUR_FRONTEND_URL/student/enroll.html?batch=${batchId}&college=${encodeURIComponent(college)}`;
   ```
3. Replace `YOUR_FRONTEND_URL` with your GitHub Pages URL (see Part 4)

## Part 4: Deploy to GitHub Pages

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the **+** icon > **New repository**
3. Repository name: **attendance**
4. Select **Public**
5. Click **Create repository**

### Step 2: Push Your Code

Open Terminal/Command Prompt in your project folder:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Student Attendance System"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/attendance.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll down to **Pages** section (left sidebar)
4. Under **Source**, select:
   - Branch: **main**
   - Folder: **/ (root)**
5. Click **Save**
6. Wait 1-2 minutes
7. Your site will be available at: `https://YOUR_USERNAME.github.io/attendance/`

### Step 4: Update OAuth Authorized Origins

1. Go back to [Google Cloud Console](https://console.cloud.google.com)
2. Go to **APIs & Services** > **Credentials**
3. Click on your OAuth Client ID
4. Under **Authorized JavaScript origins**, add:
   - `https://YOUR_USERNAME.github.io`
5. Click **Save**

### Step 5: Update Config with Final URL

1. Update `assets/js/config.js`:
   ```javascript
   APP_URL: 'https://YOUR_USERNAME.github.io/attendance'
   ```

2. Update `backend/Code.gs` line 99:
   ```javascript
   const enrollmentURL = `https://YOUR_USERNAME.github.io/attendance/student/enroll.html?batch=${batchId}&college=${encodeURIComponent(college)}`;
   const attendanceURL = `https://YOUR_USERNAME.github.io/attendance/student/attend.html?batch=${batchId}`;
   ```

3. Push changes:
   ```bash
   git add .
   git commit -m "Update URLs with GitHub Pages domain"
   git push
   ```

## Part 5: Testing Your Setup

### Test 1: Admin Dashboard

1. Go to `https://YOUR_USERNAME.github.io/attendance/admin/index.html`
2. You should see the calendar dashboard
3. Calendar should load (with mock data if no real data exists)

### Test 2: Create a Batch

1. Click **Enroll Batch** in the navigation
2. Select or add a college name
3. Click **Create Batch**
4. Two QR codes should appear:
   - Enrollment QR
   - Attendance QR
5. Download both QR codes

### Test 3: Student Enrollment

1. Open the enrollment QR code on your phone or use a QR code reader
2. Or manually visit the enrollment URL
3. Click **Sign in with Google**
4. Complete the enrollment form
5. You should see "Enrollment Successful!"

### Test 4: Mark Attendance

1. Scan the attendance QR code
2. Or manually visit the attendance URL
3. Sign in with the same Google account
4. Click **Mark Attendance for Today**
5. You should see "Attendance Marked!"

### Test 5: View Reports

1. Go back to Admin > **Calendar**
2. Click on today's date
3. You should see the student who enrolled
4. Go to **Attendance List**
5. You should see the attendance record
6. Try exporting to CSV

## Troubleshooting

### Issue: "Invalid enrollment link"
**Solution**: Make sure you're accessing the page with the correct URL parameters (`?batch=...&college=...`)

### Issue: Google Sign-In not working
**Solutions**:
- Verify OAuth Client ID is correct in all files
- Check that your domain is added to Authorized JavaScript origins
- Clear browser cache and try again
- Make sure you're using HTTPS (GitHub Pages) or localhost

### Issue: QR codes not generating
**Solutions**:
- Check browser console for errors
- Verify QRCode.js library is loading
- Make sure batch was created successfully
- Try refreshing the page

### Issue: API calls failing
**Solutions**:
- Verify Apps Script Web App URL is correct
- Check that deployment is set to "Anyone" can access
- Make sure sheets are named exactly: `batches`, `students`, `attendance`
- Check Apps Script execution logs: Apps Script editor > Executions

### Issue: No data showing on calendar
**Solutions**:
- Create a batch and enroll a student first
- Check that attendance records exist in the Google Sheet
- Verify API is returning data (check browser console)

## Local Testing

To test locally before deploying:

1. Install a simple HTTP server:
   ```bash
   # Python 3
   python3 -m http.server 8000

   # OR Node.js
   npx http-server -p 8000
   ```

2. Open browser to `http://localhost:8000/admin/index.html`

3. Note: Google OAuth may not work on localhost without proper configuration

## Next Steps

1. Customize the styling in `assets/css/style.css`
2. Add your college logo to the navigation
3. Customize email templates (if needed)
4. Set up custom domain (optional)
5. Add analytics tracking (optional)

## Security Best Practices

1. **Never share your OAuth Client Secret** (if you created one)
2. **Keep your Apps Script Web App URL private** (though it's not critical)
3. **Regularly check authorized JavaScript origins** in Google Cloud Console
4. **Review Apps Script execution logs** periodically
5. **Backup your Google Sheet** regularly

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review browser console for errors (F12)
3. Check Apps Script execution logs
4. Verify all URLs and IDs are correct

## Maintenance

### How to Update the System

1. Make changes to your code locally
2. Test thoroughly
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
4. GitHub Pages will auto-deploy in 1-2 minutes

### How to Update Apps Script

1. Make changes in the Apps Script editor
2. Click Save
3. Create new deployment: Deploy > New deployment
4. Or update existing: Deploy > Manage deployments > Edit > Deploy

## Congratulations!

Your Student Session Management System is now fully set up and ready to use!

Access your admin dashboard at:
`https://YOUR_USERNAME.github.io/attendance/admin/index.html`
