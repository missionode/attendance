/**
 * Student Session Management System - Google Apps Script Backend
 *
 * This script handles all backend operations for the attendance system
 * using Google Sheets as the database.
 *
 * Setup Instructions:
 * 1. Create a Google Spreadsheet
 * 2. Create three sheets: batches, students, attendance
 * 3. Copy this code to Apps Script editor (Extensions > Apps Script)
 * 4. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 5. Copy the Web App URL to your frontend config
 */

// Spreadsheet configuration
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEETS = {
  BATCHES: 'batches',
  STUDENTS: 'students',
  ATTENDANCE: 'attendance'
};

// Main entry point for GET and POST requests
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

// Handle all requests
function handleRequest(e) {
  try {
    const action = e.parameter.action;
    const data = e.parameter.data ? JSON.parse(e.parameter.data) : e.parameter;

    let response;

    switch(action) {
      case 'createBatch':
        response = createBatch(data);
        break;
      case 'getBatches':
        response = getBatches(data);
        break;
      case 'getBatchDetails':
        response = getBatchDetails(data);
        break;
      case 'getColleges':
        response = getColleges();
        break;
      case 'getCalendarData':
        response = getCalendarData(data);
        break;
      case 'getStudentsByDate':
        response = getStudentsByDate(data);
        break;
      case 'enrollStudent':
        response = enrollStudent(data);
        break;
      case 'checkEnrollment':
        response = checkEnrollment(data);
        break;
      case 'markAttendance':
        response = markAttendance(data);
        break;
      case 'checkTodayAttendance':
        response = checkTodayAttendance(data);
        break;
      case 'getAttendanceList':
        response = getAttendanceList(data);
        break;
      case 'getStudentAttendanceHistory':
        response = getStudentAttendanceHistory(data);
        break;
      default:
        response = { success: false, message: 'Invalid action' };
    }

    // Return with CORS headers
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Get sheet by name
function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  }

  return sheet;
}

// Initialize sheet with headers
function initializeSheet(sheet, sheetName) {
  let headers = [];

  switch(sheetName) {
    case SHEETS.BATCHES:
      headers = ['batchId', 'batchName', 'college', 'createdDate', 'enrollmentURL', 'attendanceURL', 'isActive'];
      break;
    case SHEETS.STUDENTS:
      headers = ['studentId', 'googleId', 'name', 'email', 'college', 'batchId', 'photoURL', 'enrolledDate'];
      break;
    case SHEETS.ATTENDANCE:
      headers = ['attendanceId', 'studentId', 'batchId', 'date', 'timestamp', 'college'];
      break;
  }

  if (headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
}

// Generate unique ID
function generateId(prefix) {
  return prefix + '_' + Utilities.getUuid().substring(0, 8);
}

// Generate batch name
function generateBatchName() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let name = 'BATCH_';
  for (let i = 0; i < 6; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return name;
}

// Create batch
function createBatch(data) {
  try {
    const sheet = getSheet(SHEETS.BATCHES);
    const batchId = generateId('batch');
    const batchName = data.batchName || generateBatchName();
    const college = data.college;
    const createdDate = new Date().toISOString();

    // Get the Web App URL from deployment
    const webAppUrl = ScriptApp.getService().getUrl();
    const baseUrl = webAppUrl.replace('/exec', '').replace('/dev', '');

    // Generate URLs with your GitHub Pages domain
    const enrollmentURL = `https://missionode.github.io/attendance/student/enroll.html?batch=${batchId}&college=${encodeURIComponent(college)}`;
    const attendanceURL = `https://missionode.github.io/attendance/student/attend.html?batch=${batchId}`;

    const row = [batchId, batchName, college, createdDate, enrollmentURL, attendanceURL, true];
    sheet.appendRow(row);

    return {
      success: true,
      data: {
        batchId: batchId,
        batchName: batchName,
        college: college,
        enrollmentURL: enrollmentURL,
        attendanceURL: attendanceURL
      }
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Get all batches
function getBatches(data) {
  try {
    const sheet = getSheet(SHEETS.BATCHES);
    const values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return { success: true, data: [] };
    }

    const headers = values[0];
    const batches = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const batch = {
        batchId: row[0],
        batchName: row[1],
        college: row[2],
        createdDate: row[3],
        enrollmentURL: row[4],
        attendanceURL: row[5],
        isActive: row[6]
      };

      // Apply filters if provided
      if (data.college && batch.college !== data.college) continue;
      if (data.activeOnly && !batch.isActive) continue;

      batches.push(batch);
    }

    return { success: true, data: batches };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Get batch details
function getBatchDetails(data) {
  try {
    const sheet = getSheet(SHEETS.BATCHES);
    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.batchId) {
        return {
          success: true,
          data: {
            batchId: values[i][0],
            batchName: values[i][1],
            college: values[i][2]
          }
        };
      }
    }

    return { success: false, message: 'Batch not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Get unique colleges
function getColleges() {
  try {
    const sheet = getSheet(SHEETS.BATCHES);
    const values = sheet.getDataRange().getValues();
    const colleges = new Set();

    for (let i = 1; i < values.length; i++) {
      colleges.add(values[i][2]); // college column
    }

    return { success: true, data: Array.from(colleges) };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Get calendar data
function getCalendarData(data) {
  try {
    const sheet = getSheet(SHEETS.ATTENDANCE);
    const values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return { success: true, data: [] };
    }

    const dateMap = {};

    for (let i = 1; i < values.length; i++) {
      const date = values[i][3]; // date column
      const dateStr = Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');

      if (!dateMap[dateStr]) {
        dateMap[dateStr] = 0;
      }
      dateMap[dateStr]++;
    }

    const calendarData = Object.keys(dateMap).map(date => ({
      date: date,
      totalStudents: dateMap[date]
    }));

    return { success: true, data: calendarData };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Get students by date
function getStudentsByDate(data) {
  try {
    const attendanceSheet = getSheet(SHEETS.ATTENDANCE);
    const studentsSheet = getSheet(SHEETS.STUDENTS);
    const batchesSheet = getSheet(SHEETS.BATCHES);

    const attendanceValues = attendanceSheet.getDataRange().getValues();
    const studentValues = studentsSheet.getDataRange().getValues();
    const batchValues = batchesSheet.getDataRange().getValues();

    // Create lookup maps
    const studentMap = {};
    for (let i = 1; i < studentValues.length; i++) {
      studentMap[studentValues[i][0]] = {
        studentId: studentValues[i][0],
        name: studentValues[i][2],
        email: studentValues[i][3],
        college: studentValues[i][4],
        batchId: studentValues[i][5],
        photoURL: studentValues[i][6]
      };
    }

    const batchMap = {};
    for (let i = 1; i < batchValues.length; i++) {
      batchMap[batchValues[i][0]] = batchValues[i][1]; // batchName
    }

    // Find students for the date
    const students = [];
    for (let i = 1; i < attendanceValues.length; i++) {
      const dateStr = Utilities.formatDate(new Date(attendanceValues[i][3]), Session.getScriptTimeZone(), 'yyyy-MM-dd');

      if (dateStr === data.date) {
        const studentId = attendanceValues[i][1];
        const student = studentMap[studentId];

        if (student) {
          student.batchName = batchMap[student.batchId] || 'Unknown';
          student.timestamp = attendanceValues[i][4];
          students.push(student);
        }
      }
    }

    return { success: true, data: students };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Enroll student
function enrollStudent(data) {
  try {
    const studentsSheet = getSheet(SHEETS.STUDENTS);
    const attendanceSheet = getSheet(SHEETS.ATTENDANCE);

    // Check if student already enrolled in this batch
    const studentValues = studentsSheet.getDataRange().getValues();
    for (let i = 1; i < studentValues.length; i++) {
      if (studentValues[i][1] === data.googleId && studentValues[i][5] === data.batchId) {
        return { success: false, message: 'Student already enrolled in this batch' };
      }
    }

    // Add student
    const studentId = generateId('student');
    const enrolledDate = new Date().toISOString();

    const studentRow = [
      studentId,
      data.googleId,
      data.name,
      data.email,
      data.college,
      data.batchId,
      data.photoURL || '',
      enrolledDate
    ];

    studentsSheet.appendRow(studentRow);

    // Mark attendance for today
    const attendanceId = generateId('att');
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    const attendanceRow = [
      attendanceId,
      studentId,
      data.batchId,
      dateStr,
      now.toISOString(),
      data.college
    ];

    attendanceSheet.appendRow(attendanceRow);

    return {
      success: true,
      data: {
        studentId: studentId,
        attendanceMarked: true
      }
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Check enrollment
function checkEnrollment(data) {
  try {
    const sheet = getSheet(SHEETS.STUDENTS);
    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      if (values[i][1] === data.googleId && values[i][5] === data.batchId) {
        return {
          success: true,
          data: {
            studentId: values[i][0],
            name: values[i][2],
            email: values[i][3],
            college: values[i][4],
            batchName: 'BATCH_' + data.batchId.substring(0, 6),
            enrolledDate: values[i][7]
          }
        };
      }
    }

    return { success: false, message: 'Student not enrolled' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Mark attendance
function markAttendance(data) {
  try {
    const sheet = getSheet(SHEETS.ATTENDANCE);
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    // Check if already marked today
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const recordDate = Utilities.formatDate(new Date(values[i][3]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (values[i][1] === data.studentId && recordDate === dateStr) {
        return { success: false, message: 'Attendance already marked for today' };
      }
    }

    const attendanceId = generateId('att');
    const row = [
      attendanceId,
      data.studentId,
      data.batchId,
      dateStr,
      now.toISOString(),
      data.college
    ];

    sheet.appendRow(row);

    return {
      success: true,
      data: { attendanceId: attendanceId }
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Check today's attendance
function checkTodayAttendance(data) {
  try {
    const sheet = getSheet(SHEETS.ATTENDANCE);
    const values = sheet.getDataRange().getValues();
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    for (let i = 1; i < values.length; i++) {
      const recordDate = Utilities.formatDate(new Date(values[i][3]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (values[i][1] === data.studentId && recordDate === today) {
        return {
          success: true,
          data: {
            marked: true,
            timestamp: values[i][4]
          }
        };
      }
    }

    return {
      success: true,
      data: { marked: false }
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Get attendance list
function getAttendanceList(data) {
  try {
    const attendanceSheet = getSheet(SHEETS.ATTENDANCE);
    const studentsSheet = getSheet(SHEETS.STUDENTS);
    const batchesSheet = getSheet(SHEETS.BATCHES);

    const attendanceValues = attendanceSheet.getDataRange().getValues();
    const studentValues = studentsSheet.getDataRange().getValues();
    const batchValues = batchesSheet.getDataRange().getValues();

    // Create lookup maps
    const studentMap = {};
    for (let i = 1; i < studentValues.length; i++) {
      studentMap[studentValues[i][0]] = {
        name: studentValues[i][2],
        email: studentValues[i][3],
        photoURL: studentValues[i][6]
      };
    }

    const batchMap = {};
    for (let i = 1; i < batchValues.length; i++) {
      batchMap[batchValues[i][0]] = batchValues[i][1];
    }

    const records = [];
    for (let i = 1; i < attendanceValues.length; i++) {
      const studentId = attendanceValues[i][1];
      const student = studentMap[studentId];

      if (student) {
        const record = {
          attendanceId: attendanceValues[i][0],
          studentId: studentId,
          name: student.name,
          email: student.email,
          college: attendanceValues[i][5],
          batchId: attendanceValues[i][2],
          batchName: batchMap[attendanceValues[i][2]] || 'Unknown',
          photoURL: student.photoURL,
          timestamp: attendanceValues[i][4]
        };

        records.push(record);
      }
    }

    return { success: true, data: records };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Get student attendance history
function getStudentAttendanceHistory(data) {
  try {
    const sheet = getSheet(SHEETS.ATTENDANCE);
    const values = sheet.getDataRange().getValues();

    const history = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i][1] === data.studentId) {
        history.push({
          attendanceId: values[i][0],
          timestamp: values[i][4]
        });
      }
    }

    // Sort by date descending
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit results
    const limit = data.limit || 10;

    return { success: true, data: history.slice(0, limit) };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
