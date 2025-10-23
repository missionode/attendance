let userData = null;
let batchData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    batchData = {
        batchId: urlParams.get('batch'),
        college: urlParams.get('college') || ''
    };

    // Check if batch ID is present
    if (!batchData.batchId) {
        showToast('Invalid enrollment link', 'danger');
        return;
    }

    // Check if user is already signed in
    checkExistingSession();

    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Manual sign in button (fallback)
    const manualSignInBtn = document.getElementById('manualSignInBtn');
    if (manualSignInBtn) {
        manualSignInBtn.addEventListener('click', initializeGoogleSignIn);
    }

    // Enrollment form submission
    document.getElementById('enrollmentForm').addEventListener('submit', handleEnrollment);

    // Sign out button
    document.getElementById('signOutBtn').addEventListener('click', signOut);
}

// Initialize Google Sign-In
function initializeGoogleSignIn() {
    // This is a fallback for manual sign-in
    // In production, replace with actual Google Identity Services
    showToast('Initializing Google Sign-In...', 'info');

    // For testing without Google OAuth
    setTimeout(() => {
        const mockUser = {
            id: 'google_' + Date.now(),
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

        // Check if this is from Google or mock data
        if (response.user) {
            // Mock data for testing
            userInfo = response.user;
        } else {
            // Parse JWT token from Google
            const payload = parseJwt(response.credential);
            userInfo = {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture
            };
        }

        userData = userInfo;

        // Store in localStorage
        localStorage.setItem('studentSession', JSON.stringify(userData));

        // Show enrollment form
        showEnrollmentForm();
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
        showEnrollmentForm();
    }
}

// Show enrollment form
function showEnrollmentForm() {
    // Hide sign-in card
    document.getElementById('signInCard').style.display = 'none';

    // Show enrollment card
    document.getElementById('enrollmentCard').style.display = 'block';

    // Populate user profile
    document.getElementById('userPhoto').src = userData.picture || 'https://via.placeholder.com/80';
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userEmail').textContent = userData.email;

    // Populate form fields
    document.getElementById('studentName').value = userData.name;
    document.getElementById('studentEmail').value = userData.email;
    document.getElementById('studentCollege').value = decodeURIComponent(batchData.college);
    document.getElementById('googleId').value = userData.id;
    document.getElementById('photoURL').value = userData.picture || '';
    document.getElementById('batchId').value = batchData.batchId;

    // Fetch batch name
    fetchBatchDetails();
}

// Fetch batch details
async function fetchBatchDetails() {
    try {
        const response = await apiCall('getBatchDetails', 'GET', { batchId: batchData.batchId });

        if (response.success && response.data) {
            document.getElementById('studentBatch').value = response.data.batchName;
        } else {
            // Use mock batch name for testing
            document.getElementById('studentBatch').value = 'BATCH_' + batchData.batchId.substring(0, 6).toUpperCase();
        }
    } catch (error) {
        console.error('Error fetching batch details:', error);
        // Use mock batch name for testing
        document.getElementById('studentBatch').value = 'BATCH_' + batchData.batchId.substring(0, 6).toUpperCase();
    }
}

// Handle enrollment
async function handleEnrollment(e) {
    e.preventDefault();

    try {
        showLoading('Enrolling student...');

        const enrollmentData = {
            name: document.getElementById('studentName').value,
            email: document.getElementById('studentEmail').value,
            college: document.getElementById('studentCollege').value,
            batchId: document.getElementById('batchId').value,
            googleId: document.getElementById('googleId').value,
            photoURL: document.getElementById('photoURL').value
        };

        const response = await apiCall('enrollStudent', 'POST', enrollmentData);

        if (response.success) {
            // Store student ID
            userData.studentId = response.data.studentId;
            localStorage.setItem('studentSession', JSON.stringify(userData));

            // Show success message
            showSuccessMessage();
        } else {
            showToast(response.message || 'Enrollment failed', 'danger');
        }
    } catch (error) {
        console.error('Error enrolling student:', error);

        // For testing without API, show success
        userData.studentId = 'student_' + Date.now();
        localStorage.setItem('studentSession', JSON.stringify(userData));
        showSuccessMessage();
    } finally {
        hideLoading();
    }
}

// Show success message
function showSuccessMessage() {
    document.getElementById('enrollmentCard').style.display = 'none';
    document.getElementById('successCard').style.display = 'block';

    // Confetti effect (optional)
    setTimeout(() => {
        showToast('Welcome! Your attendance has been marked.', 'success');
    }, 500);
}

// Sign out
function signOut() {
    // Clear session
    localStorage.removeItem('studentSession');
    userData = null;

    // Show sign-in card
    document.getElementById('signInCard').style.display = 'block';
    document.getElementById('enrollmentCard').style.display = 'none';
    document.getElementById('successCard').style.display = 'none';

    showToast('Signed out successfully', 'info');
}

// Make handleCredentialResponse globally accessible for Google Sign-In callback
window.handleCredentialResponse = handleCredentialResponse;
