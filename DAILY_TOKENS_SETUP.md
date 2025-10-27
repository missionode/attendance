# Daily Attendance Token System - Setup Guide

## Overview

This system generates unique daily attendance QR codes with secure tokens that expire after 24 hours, preventing students from reusing old links.

---

## What Changed?

### Security Enhancement
- **Before**: Static attendance URL (same link every day - could be reused)
- **After**: Daily unique tokens with date validation and automatic expiration

### Key Features
- ✅ Unique 16-character token generated per batch per day
- ✅ Server-side date validation (prevents timezone manipulation)
- ✅ Automatic token generation at 6 AM daily (optional)
- ✅ Token reuse prevention (same token if already generated for that date)
- ✅ Expired link detection with user-friendly error messages

---

## Files Modified

| File | Changes |
|------|---------|
| `backend/Code.gs` | Added dailyTokens sheet, 4 new API endpoints, token validation in markAttendance() |
| `admin/enroll-batch.html` | Replaced static attendance QR with date picker and generate button |
| `assets/js/batch.js` | Added generateDailyQR(), modified generateQRCodes() and copyURL() |
| `student/attend.html` | Added "Expired Link" card UI |
| `assets/js/attend.js` | Added token validation on page load, updated markAttendance() |

---

## New Database Schema

### dailyTokens Sheet

| Column | Type | Description |
|--------|------|-------------|
| tokenId | String | Unique identifier (e.g., token_abc12345) |
| batchId | String | Reference to batches sheet |
| date | String | Date in YYYY-MM-DD format |
| token | String | 16-character random token (uppercase hex) |
| createdTimestamp | ISO String | When token was generated |
| isActive | Boolean | Whether token is valid (for manual deactivation) |

**Example Row:**
```
token_abc12345 | batch_xyz789 | 2025-10-27 | A3F9D82E4B1C5F76 | 2025-10-27T06:00:00.000Z | true
```

---

## New API Endpoints

### 1. generateDailyAttendanceToken
**Action:** `generateDailyAttendanceToken`
**Method:** POST
**Parameters:**
```json
{
  "batchId": "batch_xyz789",
  "date": "2025-10-27"  // Optional, defaults to today
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "tokenId": "token_abc12345",
    "batchId": "batch_xyz789",
    "date": "2025-10-27",
    "token": "A3F9D82E4B1C5F76",
    "attendanceURL": "https://missionode.github.io/attendance/student/attend.html?batch=batch_xyz789&date=2025-10-27&token=A3F9D82E4B1C5F76",
    "alreadyExists": false
  }
}
```

### 2. validateAttendanceToken
**Action:** `validateAttendanceToken`
**Method:** GET
**Parameters:**
```json
{
  "batchId": "batch_xyz789",
  "date": "2025-10-27",
  "token": "A3F9D82E4B1C5F76"
}
```
**Response (Valid):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "tokenId": "token_abc12345",
    "validUntil": "2025-10-27 23:59:59"
  }
}
```
**Response (Expired):**
```json
{
  "success": false,
  "message": "This attendance link was for 2025-10-25, but today is 2025-10-27...",
  "errorType": "DATE_MISMATCH",
  "linkDate": "2025-10-25",
  "currentDate": "2025-10-27"
}
```

### 3. getDailyAttendanceURL
**Action:** `getDailyAttendanceURL`
**Method:** GET
**Parameters:**
```json
{
  "batchId": "batch_xyz789",
  "date": "2025-10-27"  // Optional, defaults to today
}
```

### 4. getActiveDailyTokens
**Action:** `getActiveDailyTokens`
**Method:** GET
**Parameters:**
```json
{
  "batchId": "batch_xyz789"
}
```

---

## Setup Instructions

### Step 1: Deploy Updated Backend

1. **Open Google Apps Script**
   - Go to your Google Spreadsheet
   - Click **Extensions > Apps Script**

2. **Replace Code**
   - Copy the entire contents of `backend/Code.gs`
   - Paste into the script editor (replacing old code)

3. **Verify Sheets**
   - Run the script once to auto-create the `dailyTokens` sheet
   - Check that headers are: `tokenId | batchId | date | token | createdTimestamp | isActive`

4. **Redeploy Web App**
   - Click **Deploy > Manage deployments**
   - Click **✏️ Edit** on existing deployment
   - Change version to "New version"
   - Click **Deploy**
   - Copy the new Web App URL (should be the same if using same deployment)

### Step 2: Setup Automatic Daily Token Generation (Optional but Recommended)

#### Option A: Manual Setup in Apps Script Editor

1. **In Apps Script Editor:**
   - Click the **⏰ Triggers** icon (clock icon in left sidebar)

2. **Add New Trigger:**
   - Click **+ Add Trigger** (bottom right)
   - Configure:
     - Choose function: `generateAllDailyTokens`
     - Event source: `Time-driven`
     - Type: `Day timer`
     - Time: `6am to 7am` (or your preferred time)
   - Click **Save**

3. **Authorize Permissions:**
   - Google will ask for permissions
   - Click **Review permissions**
   - Select your Google account
   - Click **Advanced > Go to [Project Name] (unsafe)**
   - Click **Allow**

#### Option B: Programmatic Setup (One-Time Run)

1. **In Apps Script Editor:**
   - Select the `setupDailyTrigger` function from the dropdown
   - Click **▶️ Run**
   - Authorize permissions when prompted
   - Check execution log to confirm: "Daily trigger set up successfully at 6 AM"

2. **Verify Trigger:**
   - Click **⏰ Triggers** in sidebar
   - You should see: `generateAllDailyTokens | Time-driven | Day timer | 6am-7am`

#### How It Works:
- Every day at 6 AM, the system automatically generates tokens for all active batches
- If a token already exists for that date, it's skipped (no duplicates)
- Logs show: "Generated: X, Skipped: Y"

#### To Remove Trigger (If Needed):
- **Manual:** Go to Triggers, click ⋮ next to trigger, click Delete
- **Programmatic:** Run the `removeDailyTrigger()` function

---

## Step 3: Deploy Frontend Changes

1. **Commit and Push Changes:**
   ```bash
   git add .
   git commit -m "Add daily attendance token system with automatic generation"
   git push origin main
   ```

2. **Wait for GitHub Pages Deployment:**
   - Go to your repository on GitHub
   - Click **Actions** tab
   - Wait for deployment to complete (~2-3 minutes)

3. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

## How to Use

### For Admins:

1. **Create/Select a Batch:**
   - Go to **Admin > Enroll Batch**
   - Create a new batch or select an existing one

2. **Generate Daily Attendance QR:**
   - In the "Daily Attendance QR Code" section
   - Select today's date (or future date)
   - Click **"Generate Daily QR"**
   - QR code appears with validity date

3. **Download/Share QR:**
   - Click **Download** to save as PNG
   - Click **Copy URL** to get the link
   - Share QR code with students

4. **Daily Workflow:**
   - **Automatic (Recommended):** Tokens generated at 6 AM automatically
   - **Manual:** Generate QR each day in admin panel
   - Students scan new QR daily to mark attendance

### For Students:

1. **Scan Daily QR Code:**
   - Scan today's QR code provided by admin
   - Sign in with Google account
   - Mark attendance

2. **If Link Expired:**
   - Red error screen appears with message
   - Example: "This attendance link was for October 25, but today is October 27"
   - Contact administrator for today's QR code

---

## Testing the System

### Test 1: Generate Token for Today
1. Admin panel > Select batch > Generate Daily QR
2. Verify: QR code shows "Valid for: [Today's Date]"
3. Copy URL and check format: `?batch=X&date=YYYY-MM-DD&token=XXXXXX`

### Test 2: Token Validation
1. Student page > Use generated URL
2. Verify: Page loads without "Expired Link" error
3. Sign in and mark attendance successfully

### Test 3: Old Link Detection
1. Manually create old URL: `?batch=X&date=2025-10-20&token=FAKE`
2. Open in browser
3. Verify: Red "Attendance Link Expired" screen appears

### Test 4: Automatic Generation (After Setup)
1. Wait for trigger time (or manually run `generateAllDailyTokens()`)
2. Check Google Sheets > dailyTokens sheet
3. Verify: New tokens created for all active batches with today's date

### Test 5: Token Reuse Prevention
1. Generate QR for today
2. Generate QR for today again (same batch, same date)
3. Verify: Message says "Using existing token for this date"
4. Check dailyTokens sheet: Only 1 row for that batch+date

---

## Monitoring & Maintenance

### Check Trigger Execution:
1. Apps Script Editor > **⚙️ Executions** (left sidebar)
2. View logs of `generateAllDailyTokens` runs
3. Check for errors or successful completion

### Manual Token Generation:
- If automatic trigger fails, manually run `generateAllDailyTokens()` in Apps Script

### View All Tokens:
- Open Google Sheets > dailyTokens sheet
- Sorted by date (newest first)
- Can manually deactivate by setting `isActive = false`

---

## Troubleshooting

### Problem: "Expired Link" even for today's date
**Solution:** Check timezone settings in Apps Script
- Apps Script Editor > Project Settings > Time zone
- Ensure it matches your location

### Problem: Automatic generation not working
**Solution:**
1. Check Triggers: Apps Script > Triggers (should show generateAllDailyTokens)
2. Check Executions: Look for errors in execution logs
3. Verify trigger time hasn't passed for today
4. Run manually: Execute `generateAllDailyTokens()` to test

### Problem: Old links still work
**Solution:**
- Verify you deployed the new Code.gs version
- Check that `markAttendance()` includes token validation code
- Clear browser cache and test with new URL

### Problem: QR not generating in admin panel
**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify API_BASE_URL in config.js points to new deployment
4. Test API endpoint directly: `[API_URL]?action=generateDailyAttendanceToken&data={"batchId":"test"}`

---

## Security Features

✅ **Token Randomness:** 16-character hex (281 trillion combinations)
✅ **Date Validation:** Server-side check prevents manipulation
✅ **Automatic Expiration:** Links only valid for specific date
✅ **No Password Storage:** Uses existing Google OAuth
✅ **HTTPS Only:** All communications encrypted
✅ **Token Uniqueness:** One token per batch per day

---

## Rollback Plan (If Needed)

If you need to revert to the old system:

1. **Restore Code.gs:**
   - Use version control to revert to previous version
   - Redeploy

2. **Restore Frontend:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Delete Trigger:**
   - Apps Script > Triggers > Delete `generateAllDailyTokens`

---

## Advanced: Custom Trigger Times

To change the automatic generation time:

1. **Delete Existing Trigger:**
   - Apps Script > Triggers > Delete current trigger

2. **Edit `setupDailyTrigger()` function:**
   ```javascript
   ScriptApp.newTrigger('generateAllDailyTokens')
     .timeBased()
     .everyDays(1)
     .atHour(8)  // Change from 6 to 8 (8 AM)
     .create();
   ```

3. **Run `setupDailyTrigger()` again**

---

## Support

For issues or questions:
1. Check execution logs in Apps Script
2. Verify all files were updated and deployed
3. Test with browser console open (F12) to see errors
4. Check GitHub repository issues

---

## Summary

✅ **Backend:** Daily token generation + validation
✅ **Frontend:** Admin date picker + student expiration UI
✅ **Automation:** Daily 6 AM token generation (optional)
✅ **Security:** 24-hour expiration + server-side validation
✅ **User Experience:** Clear error messages for expired links

**Next Steps:**
1. Deploy Code.gs to Apps Script
2. Setup automatic trigger (recommended)
3. Deploy frontend to GitHub Pages
4. Test with a sample batch
5. Train admins on daily QR generation workflow
