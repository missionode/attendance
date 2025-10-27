# Google Sheets Headers Reference

## Complete list of headers for all sheets in your attendance system

---

## 📋 Sheet 1: batches

**Sheet Name:** `batches` (all lowercase)

**Headers (Row 1):**
```
batchId | batchName | college | createdDate | enrollmentURL | attendanceURL | isActive
```

**Column Details:**
| Column | Position | Data Type | Example |
|--------|----------|-----------|---------|
| batchId | A | Text | batch_abc12345 |
| batchName | B | Text | BATCH_5X8A9B |
| college | C | Text | ABC College |
| createdDate | D | ISO Timestamp | 2025-10-27T10:30:00.000Z |
| enrollmentURL | E | URL | https://missionode.github.io/attendance/student/enroll.html?batch=... |
| attendanceURL | F | URL | https://missionode.github.io/attendance/student/attend.html?batch=... |
| isActive | G | Boolean | TRUE or FALSE |

**How to Set Up:**
1. Create/rename sheet to `batches`
2. In Row 1, type these exact headers (copy-paste from above)
3. Make Row 1 bold (select row, press Ctrl+B)

---

## 👥 Sheet 2: students

**Sheet Name:** `students` (all lowercase)

**Headers (Row 1):**
```
studentId | googleId | name | email | college | batchId | photoURL | enrolledDate
```

**Column Details:**
| Column | Position | Data Type | Example |
|--------|----------|-----------|---------|
| studentId | A | Text | student_xyz78901 |
| googleId | B | Text | 108234567890123456789 |
| name | C | Text | John Doe |
| email | D | Email | john.doe@example.com |
| college | E | Text | ABC College |
| batchId | F | Text | batch_abc12345 |
| photoURL | G | URL | https://lh3.googleusercontent.com/... |
| enrolledDate | H | ISO Timestamp | 2025-10-27T10:30:00.000Z |

**How to Set Up:**
1. Create/rename sheet to `students`
2. In Row 1, type these exact headers
3. Make Row 1 bold

---

## ✅ Sheet 3: attendance

**Sheet Name:** `attendance` (all lowercase)

**Headers (Row 1):**
```
attendanceId | studentId | batchId | date | timestamp | college
```

**Column Details:**
| Column | Position | Data Type | Example |
|--------|----------|-----------|---------|
| attendanceId | A | Text | att_def45678 |
| studentId | B | Text | student_xyz78901 |
| batchId | C | Text | batch_abc12345 |
| date | D | Date String | 2025-10-27 |
| timestamp | E | ISO Timestamp | 2025-10-27T14:25:30.000Z |
| college | F | Text | ABC College |

**How to Set Up:**
1. Create/rename sheet to `attendance`
2. In Row 1, type these exact headers
3. Make Row 1 bold

---

## 🔐 Sheet 4: dailyTokens

**Sheet Name:** `dailyTokens` (camelCase - important!)

**Headers (Row 1):**
```
tokenId | batchId | date | token | createdTimestamp | isActive
```

**Column Details:**
| Column | Position | Data Type | Example |
|--------|----------|-----------|---------|
| tokenId | A | Text | token_ghi91011 |
| batchId | B | Text | batch_abc12345 |
| date | C | Date String | 2025-10-27 |
| token | D | Text (16 chars) | A3F9D82E4B1C5F76 |
| createdTimestamp | E | ISO Timestamp | 2025-10-27T06:00:00.000Z |
| isActive | F | Boolean | TRUE or FALSE |

**How to Set Up:**
1. Create/rename sheet to `dailyTokens` (exact case matters!)
2. In Row 1, type these exact headers
3. Make Row 1 bold

---

## 🚀 Quick Setup Script

If you want to set up all sheets automatically, copy this into your Code.gs and run once:

```javascript
function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetsConfig = {
    'batches': ['batchId', 'batchName', 'college', 'createdDate', 'enrollmentURL', 'attendanceURL', 'isActive'],
    'students': ['studentId', 'googleId', 'name', 'email', 'college', 'batchId', 'photoURL', 'enrolledDate'],
    'attendance': ['attendanceId', 'studentId', 'batchId', 'date', 'timestamp', 'college'],
    'dailyTokens': ['tokenId', 'batchId', 'date', 'token', 'createdTimestamp', 'isActive']
  };

  Object.keys(sheetsConfig).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);

    // Create sheet if doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`Created sheet: ${sheetName}`);
    }

    // Clear existing data
    sheet.clear();

    // Set headers
    const headers = sheetsConfig[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

    Logger.log(`Set up headers for: ${sheetName}`);
  });

  Logger.log('All sheets configured successfully!');
}
```

**To run:**
1. Paste above code at end of Code.gs
2. Save (💾)
3. Select `setupAllSheets` from function dropdown
4. Click Run (▶️)
5. Check logs: View > Logs

---

## ✏️ Manual Setup Checklist

- [ ] Sheet 1: `batches` with 7 columns (A-G)
- [ ] Sheet 2: `students` with 8 columns (A-H)
- [ ] Sheet 3: `attendance` with 6 columns (A-F)
- [ ] Sheet 4: `dailyTokens` with 6 columns (A-F)
- [ ] All header rows are bold
- [ ] All sheet names are exactly as shown (case-sensitive for dailyTokens)
- [ ] No extra spaces in header names
- [ ] Headers in Row 1, data starts from Row 2

---

## 🔍 How to Verify Headers

Run this in Apps Script to check all headers:

```javascript
function verifyHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const expectedHeaders = {
    'batches': ['batchId', 'batchName', 'college', 'createdDate', 'enrollmentURL', 'attendanceURL', 'isActive'],
    'students': ['studentId', 'googleId', 'name', 'email', 'college', 'batchId', 'photoURL', 'enrolledDate'],
    'attendance': ['attendanceId', 'studentId', 'batchId', 'date', 'timestamp', 'college'],
    'dailyTokens': ['tokenId', 'batchId', 'date', 'token', 'createdTimestamp', 'isActive']
  };

  Object.keys(expectedHeaders).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(`❌ Sheet missing: ${sheetName}`);
      return;
    }

    const headers = sheet.getRange(1, 1, 1, expectedHeaders[sheetName].length).getValues()[0];
    const expected = expectedHeaders[sheetName];

    let match = true;
    for (let i = 0; i < expected.length; i++) {
      if (headers[i] !== expected[i]) {
        Logger.log(`❌ ${sheetName} column ${i+1}: Expected "${expected[i]}", got "${headers[i]}"`);
        match = false;
      }
    }

    if (match) {
      Logger.log(`✅ ${sheetName}: All headers correct`);
    }
  });
}
```

---

## 📝 Copy-Paste Ready Headers

### For batches sheet (Row 1):
```
batchId	batchName	college	createdDate	enrollmentURL	attendanceURL	isActive
```

### For students sheet (Row 1):
```
studentId	googleId	name	email	college	batchId	photoURL	enrolledDate
```

### For attendance sheet (Row 1):
```
attendanceId	studentId	batchId	date	timestamp	college
```

### For dailyTokens sheet (Row 1):
```
tokenId	batchId	date	token	createdTimestamp	isActive
```

**Note:** The spacing above is TAB-separated. You can copy and paste directly into your sheet, and it will fill across columns automatically!

---

## ⚠️ Common Mistakes to Avoid

1. **Extra spaces**: `" batchId"` or `"batchId "` won't work
2. **Wrong case**: `dailytokens` instead of `dailyTokens`
3. **Misspelled**: `attendence` instead of `attendance`
4. **Missing columns**: Deleting a column breaks the system
5. **Wrong order**: Columns must be in exact order shown

---

## 🎯 After Setting Up Headers

1. **Save the spreadsheet**
2. **Run the backend Code.gs** (deploy it)
3. **Test token generation** in admin panel
4. **Check dailyTokens sheet** - should have data appear

---

**All set!** These are the exact headers your system needs to work properly.
