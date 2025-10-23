# System Flow Diagram

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (GitHub Pages)                  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Admin     │  │   Student    │  │   Student    │     │
│  │  Dashboard   │  │  Enrollment  │  │  Attendance  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
└─────────┼─────────────────┼──────────────────┼──────────────┘
          │                 │                  │
          │                 │                  │
          ▼                 ▼                  ▼
    ┌─────────────────────────────────────────────────┐
    │        Google Apps Script (Backend API)         │
    │                                                  │
    │  • createBatch        • enrollStudent           │
    │  • getBatches         • markAttendance          │
    │  • getCalendarData    • getAttendanceList       │
    │  • getStudentsByDate  • checkEnrollment         │
    └────────────────────┬────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   Google Sheets (DB)    │
            │                         │
            │  • batches              │
            │  • students             │
            │  • attendance           │
            └─────────────────────────┘
```

## Admin Workflow

```
1. Admin Creates Batch
   ↓
[Admin Dashboard] → [Enroll Batch Page]
   ↓
Enter college name → Click "Create Batch"
   ↓
[Backend API: createBatch]
   ↓
[Google Sheets: batches table] ← New batch record
   ↓
Generate 2 QR Codes:
   • Enrollment QR (for registration)
   • Attendance QR (for daily check-in)
   ↓
Download & Share QR Codes

2. Admin Views Attendance
   ↓
[Calendar Dashboard] → Click on date
   ↓
[Backend API: getStudentsByDate]
   ↓
Modal shows:
   • Student names
   • Photos
   • College
   • Batch
   • Time
```

## Student Enrollment Workflow

```
Student scans Enrollment QR Code
   ↓
Redirects to: /student/enroll.html?batch=XXX&college=YYY
   ↓
[Google OAuth Sign-In]
   ↓
Student signs in with Google account
   ↓
Form pre-filled with:
   • Name (from Google)
   • Email (from Google)
   • Photo (from Google)
   • College (from QR)
   • Batch (from QR)
   ↓
Student clicks "Complete Enrollment"
   ↓
[Backend API: enrollStudent]
   ↓
[Google Sheets: students table] ← New student record
   ↓
AUTOMATICALLY:
[Backend API: markAttendance]
   ↓
[Google Sheets: attendance table] ← First attendance record
   ↓
Success Message: "Enrollment Complete! Attendance marked for today"
```

## Student Daily Attendance Workflow

```
Student scans Attendance QR Code
   ↓
Redirects to: /student/attend.html?batch=XXX
   ↓
[Google OAuth Sign-In] (if not already signed in)
   ↓
System checks enrollment status
   ↓
[Backend API: checkEnrollment]
   ↓
If enrolled:
   ↓
   Show Student Dashboard:
   • Profile photo
   • Name, email
   • College, batch
   • Recent attendance history
   ↓
   Student clicks "Mark Attendance for Today"
   ↓
   [Backend API: markAttendance]
   ↓
   [Google Sheets: attendance table] ← New attendance record
   ↓
   Success Message: "Attendance Marked!"

If NOT enrolled:
   ↓
   Show error: "Please scan enrollment QR first"
```

## Data Flow

### Creating a Batch

```
Admin Input:
{
  college: "ABC College"
}
   ↓
Backend Processing:
{
  batchId: "batch_abc123"      (generated)
  batchName: "BATCH_5X8A9B"    (auto-generated)
  college: "ABC College"
  createdDate: "2025-10-23T..."
  enrollmentURL: "https://.../enroll.html?batch=..."
  attendanceURL: "https://.../attend.html?batch=..."
  isActive: true
}
   ↓
Google Sheets (batches):
| batchId      | batchName    | college      | createdDate | enrollmentURL | attendanceURL | isActive |
|--------------|--------------|--------------|-------------|---------------|---------------|----------|
| batch_abc123 | BATCH_5X8A9B | ABC College  | 2025-10-23  | https://...   | https://...   | true     |
```

### Student Enrollment

```
Student Input (from Google OAuth):
{
  googleId: "108234567890"
  name: "John Doe"
  email: "john@gmail.com"
  photoURL: "https://..."
}
   ↓
Combined with QR parameters:
{
  batchId: "batch_abc123"
  college: "ABC College"
}
   ↓
Backend Processing:
{
  studentId: "student_xyz789"   (generated)
  googleId: "108234567890"
  name: "John Doe"
  email: "john@gmail.com"
  college: "ABC College"
  batchId: "batch_abc123"
  photoURL: "https://..."
  enrolledDate: "2025-10-23T..."
}
   ↓
Google Sheets (students):
| studentId      | googleId      | name     | email          | college      | batchId      | photoURL    | enrolledDate |
|----------------|---------------|----------|----------------|--------------|--------------|-------------|--------------|
| student_xyz789 | 108234567890  | John Doe | john@gmail.com | ABC College  | batch_abc123 | https://... | 2025-10-23   |

PLUS automatic attendance:
   ↓
Google Sheets (attendance):
| attendanceId | studentId      | batchId      | date       | timestamp         | college      |
|--------------|----------------|--------------|------------|-------------------|--------------|
| att_def456   | student_xyz789 | batch_abc123 | 2025-10-23 | 2025-10-23T10:30  | ABC College  |
```

### Marking Attendance

```
Student Input:
{
  studentId: "student_xyz789"
  batchId: "batch_abc123"
}
   ↓
Backend checks:
1. Is student enrolled? ✓
2. Already marked today? ✗
   ↓
Create attendance record:
{
  attendanceId: "att_ghi789"    (generated)
  studentId: "student_xyz789"
  batchId: "batch_abc123"
  date: "2025-10-24"
  timestamp: "2025-10-24T09:15:00Z"
  college: "ABC College"
}
   ↓
Google Sheets (attendance):
| attendanceId | studentId      | batchId      | date       | timestamp         | college      |
|--------------|----------------|--------------|------------|-------------------|--------------|
| att_ghi789   | student_xyz789 | batch_abc123 | 2025-10-24 | 2025-10-24T09:15  | ABC College  |
```

## Security & Authentication

```
┌─────────────────────────────────────────────────────┐
│              Google OAuth 2.0 Flow                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Student clicks "Sign in with Google"               │
│         ↓                                            │
│  Redirected to Google OAuth                         │
│         ↓                                            │
│  Student authorizes app                             │
│         ↓                                            │
│  Google returns JWT token                           │
│         ↓                                            │
│  Frontend extracts:                                 │
│    • User ID (sub)                                  │
│    • Name                                           │
│    • Email                                          │
│    • Photo                                          │
│         ↓                                            │
│  Store in localStorage                              │
│         ↓                                            │
│  Use for API calls                                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## QR Code System

```
┌──────────────────────────────────────────────────┐
│           Enrollment QR Code                      │
├──────────────────────────────────────────────────┤
│                                                   │
│  URL: https://yourusername.github.io/attendance/ │
│       student/enroll.html?                       │
│       batch=batch_abc123&                        │
│       college=ABC%20College                      │
│                                                   │
│  Purpose: First-time student registration        │
│  Action: Enrolls student + marks first attendance│
│                                                   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│           Attendance QR Code                      │
├──────────────────────────────────────────────────┤
│                                                   │
│  URL: https://yourusername.github.io/attendance/ │
│       student/attend.html?                       │
│       batch=batch_abc123                         │
│                                                   │
│  Purpose: Daily attendance marking                │
│  Action: Marks attendance for enrolled students   │
│                                                   │
└──────────────────────────────────────────────────┘
```

## Calendar Data Aggregation

```
Backend receives: getCalendarData(month=10, year=2025)
   ↓
Query attendance table:
   ↓
Group by date:
{
  "2025-10-20": 15 students
  "2025-10-21": 20 students
  "2025-10-22": 18 students
  "2025-10-23": 25 students
}
   ↓
Return to frontend:
[
  { date: "2025-10-20", totalStudents: 15 },
  { date: "2025-10-21", totalStudents: 20 },
  { date: "2025-10-22", totalStudents: 18 },
  { date: "2025-10-23", totalStudents: 25 }
]
   ↓
FullCalendar renders:
• Each date shows student count
• Click date → Show student list modal
```

## Error Handling

```
Student tries to enroll twice in same batch:
   ↓
Backend checks: googleId + batchId exists?
   ↓
Return: { success: false, message: "Already enrolled" }
   ↓
Frontend shows error toast

Student tries to mark attendance twice in one day:
   ↓
Backend checks: studentId + date exists?
   ↓
Return: { success: false, message: "Already marked" }
   ↓
Frontend shows "Attendance already marked at [time]"

Student tries attendance without enrollment:
   ↓
Backend checks: studentId in students table?
   ↓
Return: { success: false, message: "Not enrolled" }
   ↓
Frontend shows "Please scan enrollment QR first"
```

## This diagram shows:
1. How data flows through the system
2. What happens at each step
3. How different components interact
4. The complete user journey
5. Error handling mechanisms
