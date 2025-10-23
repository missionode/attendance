let allAttendance = [];
let filteredAttendance = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    loadAttendanceData();
});

// Initialize page with today's date
function initializePage() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    document.getElementById('startDate').value = weekAgo;
    document.getElementById('endDate').value = today;
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('applyFiltersBtn').addEventListener('click', loadAttendanceData);
    document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);
    document.getElementById('exportCSVBtn').addEventListener('click', exportToCSV);
    document.getElementById('searchStudent').addEventListener('input', filterAttendance);
}

// Load attendance data
async function loadAttendanceData() {
    try {
        showLoading('Loading attendance records...');

        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const college = document.getElementById('filterCollege').value;
        const batch = document.getElementById('filterBatch').value;

        const params = {
            startDate,
            endDate,
            college,
            batch
        };

        const response = await apiCall('getAttendanceList', 'GET', params);

        console.log('API Response:', response);

        if (response.success && response.data) {
            allAttendance = response.data;
            console.log('Loaded attendance records:', allAttendance.length);
        } else {
            allAttendance = [];
            console.log('No attendance data received');
        }

        filteredAttendance = [...allAttendance];
        displayAttendance();
        updateStatistics();
        populateFilters();
    } catch (error) {
        console.error('Error loading attendance:', error);

        // Use mock data for testing
        allAttendance = getMockAttendance();
        filteredAttendance = [...allAttendance];
        displayAttendance();
        updateStatistics();
        populateFilters();
    } finally {
        hideLoading();
    }
}

// Display attendance records
function displayAttendance() {
    const tableBody = document.getElementById('attendanceTableBody');
    const emptyState = document.getElementById('emptyState');
    const recordsCount = document.getElementById('recordsCount');

    recordsCount.textContent = filteredAttendance.length;

    if (filteredAttendance.length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    const rows = filteredAttendance.map((record, index) => {
        const date = new Date(record.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString();

        return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <img src="${record.photoURL || 'https://via.placeholder.com/40'}"
                         alt="${record.name}"
                         class="student-photo"
                         style="width: 40px; height: 40px;"
                         onerror="this.src='https://via.placeholder.com/40'">
                </td>
                <td>${record.name}</td>
                <td>${record.email}</td>
                <td>${record.college}</td>
                <td><span class="badge bg-primary">${record.batchName}</span></td>
                <td>${dateStr}</td>
                <td>${timeStr}</td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;
}

// Update statistics
function updateStatistics() {
    const totalRecords = filteredAttendance.length;
    const uniqueStudents = new Set(filteredAttendance.map(r => r.studentId)).size;
    const uniqueDates = new Set(filteredAttendance.map(r => formatDate(r.timestamp))).size;

    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('uniqueStudents').textContent = uniqueStudents;
    document.getElementById('uniqueDates').textContent = uniqueDates;
}

// Populate filter dropdowns
function populateFilters() {
    const colleges = [...new Set(allAttendance.map(r => r.college))];
    const batches = [...new Set(allAttendance.map(r => r.batchName))];

    const collegeSelect = document.getElementById('filterCollege');
    const batchSelect = document.getElementById('filterBatch');

    // Store current selections
    const currentCollege = collegeSelect.value;
    const currentBatch = batchSelect.value;

    // Clear and repopulate
    collegeSelect.innerHTML = '<option value="">All Colleges</option>';
    batchSelect.innerHTML = '<option value="">All Batches</option>';

    colleges.forEach(college => {
        const option = document.createElement('option');
        option.value = college;
        option.textContent = college;
        collegeSelect.appendChild(option);
    });

    batches.forEach(batch => {
        const option = document.createElement('option');
        option.value = batch;
        option.textContent = batch;
        batchSelect.appendChild(option);
    });

    // Restore selections
    collegeSelect.value = currentCollege;
    batchSelect.value = currentBatch;
}

// Filter attendance
function filterAttendance() {
    const searchTerm = document.getElementById('searchStudent').value.toLowerCase();

    filteredAttendance = allAttendance.filter(record => {
        return record.name.toLowerCase().includes(searchTerm) ||
               record.email.toLowerCase().includes(searchTerm);
    });

    displayAttendance();
    updateStatistics();
}

// Reset filters
function resetFilters() {
    document.getElementById('searchStudent').value = '';
    document.getElementById('filterCollege').value = '';
    document.getElementById('filterBatch').value = '';

    initializePage();
    loadAttendanceData();
}

// Export to CSV
function exportToCSV() {
    if (filteredAttendance.length === 0) {
        showToast('No records to export', 'warning');
        return;
    }

    try {
        // Prepare data for CSV
        const csvData = filteredAttendance.map(record => {
            const date = new Date(record.timestamp);
            return {
                'Student Name': record.name,
                'Email': record.email,
                'College': record.college,
                'Batch': record.batchName,
                'Date': date.toLocaleDateString(),
                'Time': date.toLocaleTimeString(),
                'Timestamp': record.timestamp
            };
        });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(csvData);

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

        // Generate filename
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const filename = `attendance_${startDate}_to_${endDate}.csv`;

        // Export
        XLSX.writeFile(wb, filename);

        showToast('CSV exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showToast('Failed to export CSV', 'danger');
    }
}

// Mock data for testing
function getMockAttendance() {
    const colleges = ['ABC College', 'XYZ University', 'PQR Institute'];
    const batches = ['BATCH_5X8A9B', 'BATCH_3K7M2N', 'BATCH_9P4Q5R'];
    const names = [
        'Rahul Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta',
        'Arjun Singh', 'Neha Reddy', 'Vikram Mehta', 'Anjali Nair',
        'Karan Malhotra', 'Pooja Desai', 'Ravi Verma', 'Divya Iyer'
    ];

    const mockData = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Generate 5-8 random records per day
        const recordsPerDay = Math.floor(Math.random() * 4) + 5;

        for (let j = 0; j < recordsPerDay; j++) {
            const randomStudent = Math.floor(Math.random() * names.length);
            const randomCollege = colleges[Math.floor(Math.random() * colleges.length)];
            const randomBatch = batches[Math.floor(Math.random() * batches.length)];

            const timestamp = new Date(date);
            timestamp.setHours(9 + Math.floor(Math.random() * 8));
            timestamp.setMinutes(Math.floor(Math.random() * 60));

            mockData.push({
                attendanceId: `att_${Date.now()}_${j}_${i}`,
                studentId: `student_${randomStudent}`,
                name: names[randomStudent],
                email: `${names[randomStudent].toLowerCase().replace(' ', '.')}@email.com`,
                college: randomCollege,
                batchName: randomBatch,
                batchId: `batch_${batches.indexOf(randomBatch)}`,
                photoURL: `https://i.pravatar.cc/40?img=${randomStudent + 1}`,
                timestamp: timestamp.toISOString()
            });
        }
    }

    return mockData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
