# Troubleshooting: "Attendance Link Expired" Error

## Problem
Every attendance link shows "Invalid attendance link. Please contact your administrator for the correct link." even for newly generated tokens.

## Root Cause
The **backend Code.gs has not been deployed yet**. The frontend is calling the new `validateAttendanceToken` API endpoint, but your Google Apps Script is still running the old version without this function.

---

## ✅ Solution: Deploy Updated Backend

### Step 1: Open Google Apps Script
1. Open your Google Spreadsheet
2. Click **Extensions > Apps Script**

### Step 2: Update Code
1. Select ALL code in the editor (`Ctrl+A` or `Cmd+A`)
2. Delete it
3. Open `/Users/syamnath/Desktop/Projects/attendance/backend/Code.gs` on your computer
4. Copy the ENTIRE file
5. Paste into Apps Script editor

### Step 3: Save
1. Click the **💾 Save** icon (or `Ctrl+S`)
2. Wait for "Saved" confirmation

### Step 4: Deploy
1. Click **Deploy > Manage deployments**
2. Click the **✏️ Edit** icon (pencil) next to your existing deployment
3. Under "Version", select **New version**
4. (Optional) Add description: "Added daily token system"
5. Click **Deploy**
6. Click **Done**

### Step 5: Verify dailyTokens Sheet
1. Go back to your Google Spreadsheet
2. Check if a new sheet called `dailyTokens` exists
   - If NO: The deployment hasn't run yet. Try generating a token in admin panel.
   - If YES: Check if it has headers: `tokenId | batchId | date | token | createdTimestamp | isActive`

---

## 🧪 How to Test After Deployment

### Test 1: Check API Endpoint
Open this URL in your browser (replace with YOUR API URL):
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=validateAttendanceToken&batchId=test&date=2025-10-27&token=test
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid attendance link...",
  "errorType": "TOKEN_NOT_FOUND"
}
```

**If you get "Invalid action"**: Backend not deployed properly.

### Test 2: Generate Token
1. Go to **Admin > Enroll Batch**
2. Select a batch
3. Make sure today's date is selected
4. Click **"Generate Daily QR"**
5. Check Google Sheets > `dailyTokens` sheet
   - Should have a new row with today's date

### Test 3: Use Generated Link
1. Copy the attendance URL from QR code
2. Paste in browser
3. Should NOT show "Expired Link" error
4. Should show Google Sign-in page

---

## 🔍 Diagnostic Steps

### Check 1: Verify Backend Deployment
```javascript
// In Apps Script editor, run this function manually:
function testValidation() {
  const result = validateAttendanceToken({
    batchId: 'test',
    date: '2025-10-27',
    token: 'test'
  });
  Logger.log(result);
}
```

**Expected Log:**
```
{ success: false, message: 'Invalid attendance link...', errorType: 'TOKEN_NOT_FOUND' }
```

**If error "validateAttendanceToken is not defined"**: Code not saved/deployed.

### Check 2: Frontend Console
1. Open attendance page
2. Press `F12` to open browser console
3. Look for errors
4. Check "Network" tab for API calls
5. Click on the `validateAttendanceToken` request
6. Check **Response** tab

**If response is "Invalid action"**: Backend doesn't have the function.

### Check 3: dailyTokens Sheet
1. Open Google Sheets
2. Look for `dailyTokens` sheet tab at the bottom
3. Check data:
   ```
   | tokenId | batchId | date | token | createdTimestamp | isActive |
   | token_abc123 | batch_xyz | 2025-10-27 | A3F9... | 2025-10-27T... | TRUE |
   ```

**If sheet doesn't exist**: Backend code not executed yet.

**If sheet is empty**: Token generation failed or not called.

---

## 🐛 Common Issues

### Issue 1: "Invalid action" in API response
**Cause**: Old backend is still deployed
**Fix**: Redeploy backend with "New version"

### Issue 2: dailyTokens sheet doesn't exist
**Cause**: Backend hasn't been run yet
**Fix**:
- Deploy backend
- Generate a token in admin panel
- Sheet will be auto-created

### Issue 3: Token generated but still shows expired
**Cause**: Date mismatch or timezone issue
**Fix**:
1. Check Apps Script timezone:
   - Apps Script editor > **⚙️ Project Settings**
   - Scroll to "Time zone"
   - Set to your location (e.g., "Asia/Kolkata" for India)
2. Redeploy backend
3. Generate new token

### Issue 4: CORS or Network errors
**Cause**: Deployment URL changed or not configured
**Fix**:
1. Get deployment URL from Apps Script
2. Update `assets/js/config.js` line 4:
   ```javascript
   API_BASE_URL: 'YOUR_NEW_DEPLOYMENT_URL'
   ```
3. Redeploy frontend (git push)

---

## 📋 Quick Checklist

Before asking for help, verify:
- [ ] Backend Code.gs has been updated with all token functions
- [ ] Backend has been saved in Apps Script editor
- [ ] Backend has been deployed as "New version"
- [ ] `dailyTokens` sheet exists in Google Sheets
- [ ] dailyTokens sheet has correct headers (6 columns)
- [ ] Apps Script timezone matches your location
- [ ] Frontend config.js has correct API_BASE_URL
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] Tested with today's date (not past/future)

---

## 🆘 Still Not Working?

### Enable Logging
Add this to attend.js after line 232:
```javascript
console.log('Token validation response:', response);
```

Refresh page, open console (F12), and share the log output.

### Check Apps Script Execution Log
1. Apps Script editor > **⚙️ Executions** (left sidebar)
2. Look for recent `validateAttendanceToken` executions
3. Check for errors

### Manual Backend Test
Run this in Apps Script editor:
```javascript
function testSystem() {
  // 1. Generate token
  const token = generateDailyAttendanceToken({
    batchId: 'batch_test',
    date: '2025-10-27'
  });
  Logger.log('Generated:', token);

  // 2. Validate token
  const validation = validateAttendanceToken({
    batchId: 'batch_test',
    date: '2025-10-27',
    token: token.data.token
  });
  Logger.log('Validation:', validation);
}
```

**Expected Log:**
```
Generated: { success: true, data: { tokenId: ..., token: ... } }
Validation: { success: true, message: 'Token is valid' }
```

---

**Most Common Fix:** Just deploy the backend! 99% chance that's the issue.
