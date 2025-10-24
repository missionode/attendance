let calendar;
let allStudents = [];
let filteredStudents = [];

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    setupEventListeners();
});

// Initialize FullCalendar
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        height: 'auto',
        dateClick: handleDateClick,
        datesSet: handleMonthChange,
        eventContent: function(arg) {
            return {
                html: `<div style="padding: 2px 5px; font-weight: 600;">
                        <i class="bi bi-people-fill"></i> ${arg.event.title}
                       </div>`
            };
        }
    });

    calendar.render();
    loadCalendarData();
}

// Load calendar data from API
async function loadCalendarData() {
    try {
        showLoading('Loading calendar data...');

        // Get current month and year from calendar
        const currentDate = calendar.getDate();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        // Call API to get calendar data
        const response = await apiCall('getCalendarData', 'GET', { month, year });

        if (response.success) {
            updateCalendarEvents(response.data);
        } else {
            // Clear calendar and show empty state
            calendar.removeAllEvents();
            showToast(response.message || 'Failed to load calendar data', 'warning');
        }
    } catch (error) {
        console.error('Error loading calendar:', error);
        // Clear calendar and show error
        calendar.removeAllEvents();
        showToast('Failed to load calendar data. Please check your connection.', 'danger');
    } finally {
        hideLoading();
    }
}

// Update calendar with events
function updateCalendarEvents(calendarData) {
    // Clear existing events
    calendar.removeAllEvents();

    // Add events for each date with students
    calendarData.forEach(item => {
        if (item.totalStudents > 0) {
            calendar.addEvent({
                title: `${item.totalStudents} students`,
                start: item.date,
                allDay: true,
                backgroundColor: '#4285f4',
                borderColor: '#4285f4',
                extendedProps: {
                    studentCount: item.totalStudents
                }
            });
        }
    });
}

// Handle date click
async function handleDateClick(info) {
    const clickedDate = info.dateStr;
    await loadStudentsForDate(clickedDate);
    showStudentModal(clickedDate);
}

// Handle month change
function handleMonthChange(dateInfo) {
    loadCalendarData();
}

// Load students for specific date
async function loadStudentsForDate(date) {
    try {
        showLoading('Loading students...');

        const response = await apiCall('getStudentsByDate', 'GET', { date });

        if (response.success) {
            allStudents = response.data || [];
            filteredStudents = [...allStudents];
        } else {
            allStudents = [];
            filteredStudents = [];
            showToast(response.message || 'Failed to load students', 'warning');
        }
    } catch (error) {
        console.error('Error loading students:', error);
        // Show empty state instead of mock data
        allStudents = [];
        filteredStudents = [];
        showToast('Failed to load students. Please check your connection.', 'danger');
    } finally {
        hideLoading();
    }
}

// Show student modal
function showStudentModal(date) {
    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('modalDate').textContent = formattedDate;

    // Populate filter dropdowns
    populateFilters();

    // Display students
    displayStudents();

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('studentModal'));
    modal.show();
}

// Populate filter dropdowns
function populateFilters() {
    const colleges = [...new Set(allStudents.map(s => s.college))];
    const batches = [...new Set(allStudents.map(s => s.batchName))];

    const collegeSelect = document.getElementById('filterCollege');
    const batchSelect = document.getElementById('filterBatch');

    // Clear existing options except first
    collegeSelect.innerHTML = '<option value="">All Colleges</option>';
    batchSelect.innerHTML = '<option value="">All Batches</option>';

    // Add college options
    colleges.forEach(college => {
        const option = document.createElement('option');
        option.value = college;
        option.textContent = college;
        collegeSelect.appendChild(option);
    });

    // Add batch options
    batches.forEach(batch => {
        const option = document.createElement('option');
        option.value = batch;
        option.textContent = batch;
        batchSelect.appendChild(option);
    });
}

// Display students
function displayStudents() {
    const studentList = document.getElementById('studentList');
    const emptyState = document.getElementById('emptyState');
    const totalStudents = document.getElementById('totalStudents');

    // Update total count
    totalStudents.textContent = filteredStudents.length;

    if (filteredStudents.length === 0) {
        studentList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Generate student cards
    const studentCards = filteredStudents.map(student => `
        <div class="student-card">
            <img src="${student.photoURL || 'https://via.placeholder.com/50'}"
                 alt="${student.name}"
                 class="student-photo"
                 onerror="this.src='https://via.placeholder.com/50'">
            <div class="student-info flex-grow-1">
                <h6>${student.name}</h6>
                <p>
                    <i class="bi bi-building"></i> ${student.college}
                    <span class="ms-3">
                        <i class="bi bi-tag"></i> ${student.batchName}
                    </span>
                </p>
                <small class="text-muted">
                    <i class="bi bi-clock"></i> ${formatTimestamp(student.timestamp)}
                </small>
            </div>
        </div>
    `).join('');

    studentList.innerHTML = studentCards;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchStudent');
    if (searchInput) {
        searchInput.addEventListener('input', filterStudents);
    }

    // Filter dropdowns
    const collegeFilter = document.getElementById('filterCollege');
    const batchFilter = document.getElementById('filterBatch');

    if (collegeFilter) {
        collegeFilter.addEventListener('change', filterStudents);
    }

    if (batchFilter) {
        batchFilter.addEventListener('change', filterStudents);
    }
}

// Filter students based on search and filters
function filterStudents() {
    const searchTerm = document.getElementById('searchStudent').value.toLowerCase();
    const collegeFilter = document.getElementById('filterCollege').value;
    const batchFilter = document.getElementById('filterBatch').value;

    filteredStudents = allStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm) ||
                            student.college.toLowerCase().includes(searchTerm);
        const matchesCollege = !collegeFilter || student.college === collegeFilter;
        const matchesBatch = !batchFilter || student.batchName === batchFilter;

        return matchesSearch && matchesCollege && matchesBatch;
    });

    displayStudents();
}

// Mock data for testing (remove when API is ready)
function loadMockData() {
    const mockData = [
        { date: '2025-10-20', totalStudents: 15 },
        { date: '2025-10-21', totalStudents: 20 },
        { date: '2025-10-22', totalStudents: 18 },
        { date: '2025-10-23', totalStudents: 25 }
    ];
    updateCalendarEvents(mockData);
}

function getMockStudents(date) {
    // Generate mock students for testing
    const colleges = ['ABC College', 'XYZ University', 'PQR Institute'];
    const batches = ['BATCH_5X8A9B', 'BATCH_3K7M2N', 'BATCH_9P4Q5R'];
    const names = [
        'Rahul Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta',
        'Arjun Singh', 'Neha Reddy', 'Vikram Mehta', 'Anjali Nair'
    ];

    return names.map((name, index) => ({
        studentId: `student_${index}`,
        name: name,
        email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
        college: colleges[index % colleges.length],
        batchName: batches[index % batches.length],
        photoURL: `https://i.pravatar.cc/50?img=${index + 1}`,
        timestamp: new Date().toISOString()
    }));
}
