let userData = null;
let batchId = null;
let studentData = null;
let todayAttendance = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Get batch ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    batchId = urlParams.get('batch');

    if (!batchId) {
        showToast('Invalid attendance link', 'danger');
        return;
    }

    // Check if user is already signed in
    checkExistingSession();

    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Manual sign in button
    const manualSignInBtn = document.getElementById('manualSignInBtn');
    if (manualSignInBtn) {
        manualSignInBtn.addEventListener('click', initializeGoogleSignIn);
    }

    // Mark attendance button
    document.getElementById('markAttendanceBtn').addEventListener('click', markAttendance);

    // Sign out button
    document.getElementById('signOutBtn').addEventListener('click', signOut);

    // Back to dashboard button
    document.getElementById('backToDashboardBtn').addEventListener('click', backToDashboard);

    // Go back button
    document.getElementById('goBackBtn').addEventListener('click', () => {
        window.history.back();
    });
}

// Initialize Google Sign-In
function initializeGoogleSignIn() {
    showToast('Initializing Google Sign-In...', 'info');

    // For testing without Google OAuth
    setTimeout(() => {
        const mockUser = {
            id: 'google_123456',
            name: 'Test Student',
            email: 'student@example.com',
            picture: 'https://i.pravatar.cc/80?img=1'
        };
        handleCredentialResponse({ credential: 'mock_credential', user: mockUser });
    }, 1000);
}

// Handle Google Sign-In response
function handleCredentialResponse(response) {
    try {
        let userInfo;

        if (response.user) {
            userInfo = response.user;
        } else {
            const payload = parseJwt(response.credential);
            userInfo = {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture
            };
        }

        userData = userInfo;
        localStorage.setItem('studentSession', JSON.stringify(userData));

        // Check if student is enrolled
        checkEnrollmentStatus();
    } catch (error) {
        console.error('Error handling sign-in:', error);
        showToast('Sign-in failed. Please try again.', 'danger');
    }
}

// Parse JWT token
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

// Check existing session
function checkExistingSession() {
    const session = localStorage.getItem('studentSession');

    if (session) {
        userData = JSON.parse(session);
        checkEnrollmentStatus();
    } else {
        showSignInCard();
    }
}

// Show sign-in card
function showSignInCard() {
    document.getElementById('signInRequiredCard').style.display = 'block';
    document.getElementById('attendanceCard').style.display = 'none';
    document.getElementById('successCard').style.display = 'none';
    document.getElementById('notEnrolledCard').style.display = 'none';
}

// Check enrollment status
async function checkEnrollmentStatus() {
    try {
        showLoading('Checking enrollment...');

        const response = await apiCall('checkEnrollment', 'GET', {
            googleId: userData.id,
            batchId: batchId
        });

        if (response.success && response.data) {
            studentData = response.data;
            showAttendanceCard();
            checkTodayAttendance();
        } else {
            showNotEnrolledCard();
        }
    } catch (error) {
        console.error('Error checking enrollment:', error);

        // For testing without API, use mock data
        studentData = {
            studentId: 'student_123',
            name: userData.name,
            email: userData.email,
            college: 'ABC College',
            batchName: 'BATCH_5X8A9B',
            enrolledDate: new Date().toISOString()
        };
        showAttendanceCard();
        checkTodayAttendance();
    } finally {
        hideLoading();
    }
}

// Show not enrolled card
function showNotEnrolledCard() {
    document.getElementById('signInRequiredCard').style.display = 'none';
    document.getElementById('attendanceCard').style.display = 'none';
    document.getElementById('successCard').style.display = 'none';
    document.getElementById('notEnrolledCard').style.display = 'block';
}

// Show attendance card
function showAttendanceCard() {
    document.getElementById('signInRequiredCard').style.display = 'none';
    document.getElementById('attendanceCard').style.display = 'block';
    document.getElementById('successCard').style.display = 'none';
    document.getElementById('notEnrolledCard').style.display = 'none';

    // Populate student info
    document.getElementById('studentPhoto').src = userData.picture || 'https://via.placeholder.com/80';
    document.getElementById('studentName').textContent = studentData.name;
    document.getElementById('studentEmail').textContent = studentData.email;
    document.getElementById('studentCollege').textContent = studentData.college;
    document.getElementById('studentBatch').textContent = studentData.batchName;

    // Load attendance history
    loadAttendanceHistory();
}

// Check today's attendance
async function checkTodayAttendance() {
    try {
        const today = formatDate(new Date());

        const response = await apiCall('checkTodayAttendance', 'GET', {
            studentId: studentData.studentId,
            batchId: batchId,
            date: today
        });

        if (response.success && response.data && response.data.marked) {
            todayAttendance = response.data;
            showAlreadyMarked();
        } else {
            showMarkAttendanceButton();
        }
    } catch (error) {
        console.error('Error checking today\'s attendance:', error);
        // For testing, assume not marked
        showMarkAttendanceButton();
    }
}

// Show already marked message
function showAlreadyMarked() {
    document.getElementById('attendanceStatus').style.display = 'none';
    document.getElementById('markAttendanceSection').style.display = 'none';
    document.getElementById('alreadyMarkedMessage').style.display = 'block';

    const markedTime = new Date(todayAttendance.timestamp).toLocaleTimeString();
    document.getElementById('markedTime').textContent = markedTime;
}

// Show mark attendance button
function showMarkAttendanceButton() {
    document.getElementById('attendanceStatus').style.display = 'none';
    document.getElementById('markAttendanceSection').style.display = 'block';
    document.getElementById('alreadyMarkedMessage').style.display = 'none';
}

// Mark attendance
async function markAttendance() {
    try {
        showLoading('Marking attendance...');

        const attendanceData = {
            studentId: studentData.studentId,
            batchId: batchId,
            college: studentData.college
        };

        const response = await apiCall('markAttendance', 'POST', attendanceData);

        if (response.success) {
            showSuccessCard();
        } else {
            showToast(response.message || 'Failed to mark attendance', 'danger');
        }
    } catch (error) {
        console.error('Error marking attendance:', error);

        // For testing without API
        showSuccessCard();
    } finally {
        hideLoading();
    }
}

// Show success card
function showSuccessCard() {
    document.getElementById('attendanceCard').style.display = 'none';
    document.getElementById('successCard').style.display = 'block';

    const now = new Date();
    document.getElementById('successTime').textContent = now.toLocaleString();

    // Update today's attendance
    todayAttendance = {
        marked: true,
        timestamp: now.toISOString()
    };
}

// Back to dashboard
function backToDashboard() {
    document.getElementById('successCard').style.display = 'none';
    document.getElementById('attendanceCard').style.display = 'block';

    // Refresh attendance status
    checkTodayAttendance();
    loadAttendanceHistory();
}

// Load attendance history
async function loadAttendanceHistory() {
    try {
        const response = await apiCall('getStudentAttendanceHistory', 'GET', {
            studentId: studentData.studentId,
            batchId: batchId,
            limit: 10
        });

        if (response.success && response.data) {
            displayAttendanceHistory(response.data);
        } else {
            displayAttendanceHistory([]);
        }
    } catch (error) {
        console.error('Error loading attendance history:', error);

        // Use mock data for testing
        const mockHistory = getMockAttendanceHistory();
        displayAttendanceHistory(mockHistory);
    }
}

// Display attendance history
function displayAttendanceHistory(history) {
    const container = document.getElementById('attendanceHistory');

    if (history.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No attendance history yet</p>';
        return;
    }

    const historyHTML = history.map(record => {
        const date = new Date(record.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString();

        return `
            <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                <div>
                    <div class="fw-bold">${dateStr}</div>
                    <small class="text-muted">${timeStr}</small>
                </div>
                <span class="badge bg-success">
                    <i class="bi bi-check-lg"></i> Present
                </span>
            </div>
        `;
    }).join('');

    container.innerHTML = historyHTML;
}

// Sign out
function signOut() {
    localStorage.removeItem('studentSession');
    userData = null;
    studentData = null;
    todayAttendance = null;

    showSignInCard();
    showToast('Signed out successfully', 'info');
}

// Mock attendance history
function getMockAttendanceHistory() {
    const history = [];
    const today = new Date();

    for (let i = 1; i <= 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(10 + Math.floor(Math.random() * 3));
        date.setMinutes(Math.floor(Math.random() * 60));

        history.push({
            attendanceId: `att_${i}`,
            timestamp: date.toISOString()
        });
    }

    return history;
}

// Make handleCredentialResponse globally accessible
window.handleCredentialResponse = handleCredentialResponse;
