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
  ATTENDANCE: 'attendance',
  DAILY_TOKENS: 'dailyTokens'
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
      case 'updateCollege':
        response = updateCollege(data);
        break;
      case 'deleteCollege':
        response = deleteCollege(data);
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
      case 'generateDailyAttendanceToken':
        response = generateDailyAttendanceToken(data);
        break;
      case 'validateAttendanceToken':
        response = validateAttendanceToken(data);
        break;
      case 'getDailyAttendanceURL':
        response = getDailyAttendanceURL(data);
        break;
      case 'getActiveDailyTokens':
        response = getActiveDailyTokens(data);
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
    case SHEETS.DAILY_TOKENS:
      headers = ['tokenId', 'batchId', 'date', 'token', 'createdTimestamp', 'isActive'];
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

    // Generate unique batch name
    let batchName = data.batchName || generateUniqueBatchName(sheet);

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

// Generate unique batch name
function generateUniqueBatchName(sheet) {
  const values = sheet.getDataRange().getValues();
  const existingNames = new Set();

  // Collect existing batch names
  for (let i = 1; i < values.length; i++) {
    existingNames.add(values[i][1]); // batchName column
  }

  // Generate unique name
  let batchName;
  let attempts = 0;
  do {
    batchName = generateBatchName();
    attempts++;
  } while (existingNames.has(batchName) && attempts < 100);

  return batchName;
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

// Update college name across all sheets
function updateCollege(data) {
  try {
    const oldName = data.oldName;
    const newName = data.newName;

    if (!oldName || !newName) {
      return { success: false, message: 'Old name and new name are required' };
    }

    if (oldName === newName) {
      return { success: false, message: 'New name is same as old name' };
    }

    // Update in batches sheet
    const batchesSheet = getSheet(SHEETS.BATCHES);
    const batchesValues = batchesSheet.getDataRange().getValues();
    let batchesUpdated = 0;

    for (let i = 1; i < batchesValues.length; i++) {
      if (batchesValues[i][2] === oldName) {
        batchesSheet.getRange(i + 1, 3).setValue(newName);
        batchesUpdated++;
      }
    }

    // Update in students sheet
    const studentsSheet = getSheet(SHEETS.STUDENTS);
    const studentsValues = studentsSheet.getDataRange().getValues();
    let studentsUpdated = 0;

    for (let i = 1; i < studentsValues.length; i++) {
      if (studentsValues[i][4] === oldName) {
        studentsSheet.getRange(i + 1, 5).setValue(newName);
        studentsUpdated++;
      }
    }

    // Update in attendance sheet
    const attendanceSheet = getSheet(SHEETS.ATTENDANCE);
    const attendanceValues = attendanceSheet.getDataRange().getValues();
    let attendanceUpdated = 0;

    for (let i = 1; i < attendanceValues.length; i++) {
      if (attendanceValues[i][5] === oldName) {
        attendanceSheet.getRange(i + 1, 6).setValue(newName);
        attendanceUpdated++;
      }
    }

    return {
      success: true,
      message: 'College name updated successfully',
      data: {
        batchesUpdated: batchesUpdated,
        studentsUpdated: studentsUpdated,
        attendanceUpdated: attendanceUpdated
      }
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Delete college (only if no batches exist)
function deleteCollege(data) {
  try {
    const collegeName = data.collegeName;

    if (!collegeName) {
      return { success: false, message: 'College name is required' };
    }

    // Check if any batches exist with this college
    const batchesSheet = getSheet(SHEETS.BATCHES);
    const batchesValues = batchesSheet.getDataRange().getValues();

    for (let i = 1; i < batchesValues.length; i++) {
      if (batchesValues[i][2] === collegeName) {
        return {
          success: false,
          message: 'Cannot delete college: batches exist with this college name. Please update or delete the batches first.'
        };
      }
    }

    // If we reach here, no batches use this college
    // Since colleges are derived from batches, there's nothing to delete
    return {
      success: true,
      message: 'College has no associated batches and can be removed from the list'
    };
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
    const studentsSheet = getSheet(SHEETS.STUDENTS);
    const batchesSheet = getSheet(SHEETS.BATCHES);

    const studentValues = studentsSheet.getDataRange().getValues();
    const batchValues = batchesSheet.getDataRange().getValues();

    // Create batch map
    const batchMap = {};
    for (let i = 1; i < batchValues.length; i++) {
      batchMap[batchValues[i][0]] = batchValues[i][1]; // batchId -> batchName
    }

    // Find enrolled student
    for (let i = 1; i < studentValues.length; i++) {
      if (studentValues[i][1] === data.googleId && studentValues[i][5] === data.batchId) {
        return {
          success: true,
          data: {
            studentId: studentValues[i][0],
            name: studentValues[i][2],
            email: studentValues[i][3],
            college: studentValues[i][4],
            batchName: batchMap[data.batchId] || 'Unknown Batch',
            enrolledDate: studentValues[i][7]
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
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    // Validate token if provided
    if (data.token && data.date) {
      const tokenValidation = validateAttendanceToken({
        batchId: data.batchId,
        date: data.date,
        token: data.token
      });

      if (!tokenValidation.success) {
        return {
          success: false,
          message: tokenValidation.message,
          errorType: tokenValidation.errorType
        };
      }
    }

    const sheet = getSheet(SHEETS.ATTENDANCE);

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

    // Parse filter parameters
    const startDate = data.startDate ? new Date(data.startDate) : null;
    const endDate = data.endDate ? new Date(data.endDate) : null;
    const collegeFilter = data.college || '';
    const batchFilter = data.batch || '';

    const records = [];
    for (let i = 1; i < attendanceValues.length; i++) {
      const studentId = attendanceValues[i][1];
      const student = studentMap[studentId];

      if (student) {
        const recordDate = new Date(attendanceValues[i][3]); // date column
        const college = attendanceValues[i][5];
        const batchId = attendanceValues[i][2];
        const batchName = batchMap[batchId] || 'Unknown';

        // Apply filters
        if (startDate && recordDate < startDate) continue;
        if (endDate) {
          const endDatePlusOne = new Date(endDate);
          endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
          if (recordDate >= endDatePlusOne) continue;
        }
        if (collegeFilter && college !== collegeFilter) continue;
        if (batchFilter && batchName !== batchFilter) continue;

        const record = {
          attendanceId: attendanceValues[i][0],
          studentId: studentId,
          name: student.name,
          email: student.email,
          college: college,
          batchId: batchId,
          batchName: batchName,
          photoURL: student.photoURL,
          timestamp: attendanceValues[i][4]
        };

        records.push(record);
      }
    }

    // Sort by timestamp descending (newest first)
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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

// ============================================
// DAILY TOKEN MANAGEMENT FUNCTIONS
// ============================================

// Generate unique daily token
function generateDailyToken() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 16).toUpperCase();
}

// Generate daily attendance token for a batch
function generateDailyAttendanceToken(data) {
  try {
    const sheet = getSheet(SHEETS.DAILY_TOKENS);
    const batchId = data.batchId;
    const dateStr = data.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    if (!batchId) {
      return { success: false, message: 'Batch ID is required' };
    }

    // Check if token already exists for this batch and date
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const existingBatchId = values[i][1];
      const existingDate = values[i][2];
      const isActive = values[i][5];

      if (existingBatchId === batchId && existingDate === dateStr && isActive) {
        // Return existing active token
        return {
          success: true,
          data: {
            tokenId: values[i][0],
            batchId: values[i][1],
            date: values[i][2],
            token: values[i][3],
            attendanceURL: `https://missionode.github.io/attendance/student/attend.html?batch=${batchId}&date=${dateStr}&token=${values[i][3]}`,
            alreadyExists: true
          }
        };
      }
    }

    // Generate new token
    const tokenId = generateId('token');
    const token = generateDailyToken();
    const createdTimestamp = new Date().toISOString();
    const isActive = true;

    const row = [tokenId, batchId, dateStr, token, createdTimestamp, isActive];
    sheet.appendRow(row);

    const attendanceURL = `https://missionode.github.io/attendance/student/attend.html?batch=${batchId}&date=${dateStr}&token=${token}`;

    return {
      success: true,
      data: {
        tokenId: tokenId,
        batchId: batchId,
        date: dateStr,
        token: token,
        attendanceURL: attendanceURL,
        alreadyExists: false
      }
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Validate attendance token
function validateAttendanceToken(data) {
  try {
    const batchId = data.batchId;
    const dateStr = data.date;
    const token = data.token;

    if (!batchId || !dateStr || !token) {
      return {
        success: false,
        message: 'Batch ID, date, and token are required',
        errorType: 'MISSING_PARAMETERS'
      };
    }

    // Check if date is today
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (dateStr !== today) {
      return {
        success: false,
        message: `This attendance link was for ${dateStr}, but today is ${today}. Please use today's attendance link.`,
        errorType: 'DATE_MISMATCH',
        linkDate: dateStr,
        currentDate: today
      };
    }

    const sheet = getSheet(SHEETS.DAILY_TOKENS);
    const values = sheet.getDataRange().getValues();

    // Find matching token
    for (let i = 1; i < values.length; i++) {
      if (values[i][1] === batchId && values[i][2] === dateStr && values[i][3] === token) {
        const isActive = values[i][5];

        if (!isActive) {
          return {
            success: false,
            message: 'This attendance link has been deactivated',
            errorType: 'TOKEN_INACTIVE'
          };
        }

        return {
          success: true,
          message: 'Token is valid',
          data: {
            tokenId: values[i][0],
            validUntil: dateStr + ' 23:59:59'
          }
        };
      }
    }

    return {
      success: false,
      message: 'Invalid attendance link. Please contact your administrator.',
      errorType: 'TOKEN_NOT_FOUND'
    };
  } catch (error) {
    return { success: false, message: error.toString(), errorType: 'SYSTEM_ERROR' };
  }
}

// Get daily attendance URL for a batch and date
function getDailyAttendanceURL(data) {
  try {
    const batchId = data.batchId;
    const dateStr = data.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    if (!batchId) {
      return { success: false, message: 'Batch ID is required' };
    }

    const sheet = getSheet(SHEETS.DAILY_TOKENS);
    const values = sheet.getDataRange().getValues();

    // Find active token for this batch and date
    for (let i = 1; i < values.length; i++) {
      if (values[i][1] === batchId && values[i][2] === dateStr && values[i][5]) {
        const token = values[i][3];
        const attendanceURL = `https://missionode.github.io/attendance/student/attend.html?batch=${batchId}&date=${dateStr}&token=${token}`;

        return {
          success: true,
          data: {
            tokenId: values[i][0],
            batchId: batchId,
            date: dateStr,
            token: token,
            attendanceURL: attendanceURL
          }
        };
      }
    }

    return {
      success: false,
      message: 'No active token found for this date. Please generate a new token.'
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Get active daily tokens for a batch
function getActiveDailyTokens(data) {
  try {
    const batchId = data.batchId;

    if (!batchId) {
      return { success: false, message: 'Batch ID is required' };
    }

    const sheet = getSheet(SHEETS.DAILY_TOKENS);
    const values = sheet.getDataRange().getValues();

    const tokens = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i][1] === batchId) {
        const dateStr = values[i][2];
        const token = values[i][3];

        tokens.push({
          tokenId: values[i][0],
          batchId: values[i][1],
          date: dateStr,
          token: token,
          createdTimestamp: values[i][4],
          isActive: values[i][5],
          attendanceURL: `https://missionode.github.io/attendance/student/attend.html?batch=${batchId}&date=${dateStr}&token=${token}`
        });
      }
    }

    // Sort by date descending (newest first)
    tokens.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { success: true, data: tokens };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ============================================
// AUTOMATIC DAILY TOKEN GENERATION
// ============================================

// Setup daily trigger (run this once manually)
function setupDailyTrigger() {
  try {
    // Delete existing triggers to avoid duplicates
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'generateAllDailyTokens') {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    // Create new trigger at 6 AM daily
    ScriptApp.newTrigger('generateAllDailyTokens')
      .timeBased()
      .everyDays(1)
      .atHour(6)
      .create();

    return { success: true, message: 'Daily trigger set up successfully at 6 AM' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Generate tokens for all active batches (called by trigger)
function generateAllDailyTokens() {
  try {
    const batchesResponse = getBatches({ activeOnly: true });

    if (!batchesResponse.success || !batchesResponse.data) {
      Logger.log('No active batches found');
      return;
    }

    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    let generatedCount = 0;
    let skippedCount = 0;

    batchesResponse.data.forEach(batch => {
      const result = generateDailyAttendanceToken({
        batchId: batch.batchId,
        date: today
      });

      if (result.success) {
        if (result.data.alreadyExists) {
          skippedCount++;
          Logger.log(`Token already exists for batch: ${batch.batchName}`);
        } else {
          generatedCount++;
          Logger.log(`Generated token for batch: ${batch.batchName}`);
        }
      } else {
        Logger.log(`Failed to generate token for batch: ${batch.batchName} - ${result.message}`);
      }
    });

    Logger.log(`Daily token generation complete. Generated: ${generatedCount}, Skipped: ${skippedCount}`);
    return { generated: generatedCount, skipped: skippedCount };
  } catch (error) {
    Logger.log('Error in generateAllDailyTokens: ' + error.toString());
    return { error: error.toString() };
  }
}

// Remove daily trigger (if needed)
function removeDailyTrigger() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let deletedCount = 0;

    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'generateAllDailyTokens') {
        ScriptApp.deleteTrigger(trigger);
        deletedCount++;
      }
    });

    return { success: true, message: `Removed ${deletedCount} trigger(s)` };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
