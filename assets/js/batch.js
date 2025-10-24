let allBatches = [];
let filteredBatches = [];
let colleges = [];
let currentQRCodes = {
    enrollment: null,
    attendance: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadColleges();
    loadBatches();
    setupEventListeners();
    generateNewBatchName();
    initializeSearchableSelects();
});

// Setup event listeners
function setupEventListeners() {
    // Batch form submission
    document.getElementById('batchForm').addEventListener('submit', handleBatchSubmit);

    // Generate batch name button
    document.getElementById('generateBatchName').addEventListener('click', generateNewBatchName);

    // Reset form button
    document.getElementById('resetFormBtn').addEventListener('click', resetForm);

    // Add college button
    document.getElementById('saveCollegeBtn').addEventListener('click', handleAddCollege);

    // Search batch
    document.getElementById('searchBatch').addEventListener('input', filterBatchList);

    // Filter by college
    document.getElementById('filterBatchCollege').addEventListener('change', filterBatchList);
}

// Generate new batch name
function generateNewBatchName() {
    const batchName = generateBatchName();
    document.getElementById('batchName').value = batchName;
}

// Initialize searchable select dropdowns
function initializeSearchableSelects() {
    // Initialize college select with Select2
    $('#collegeSelect').select2({
        theme: 'bootstrap-5',
        placeholder: 'Search or select college...',
        allowClear: true,
        width: '100%',
        tags: false
    });

    // Initialize filter college select with Select2
    $('#filterBatchCollege').select2({
        theme: 'bootstrap-5',
        placeholder: 'All Colleges',
        allowClear: true,
        width: '100%'
    });
}

// Load colleges
async function loadColleges() {
    try {
        const response = await apiCall('getColleges', 'GET');

        if (response.success && response.data) {
            colleges = response.data;
        } else {
            // Use mock data for testing
            colleges = ['ABC College', 'XYZ University', 'PQR Institute'];
        }

        populateCollegeDropdowns();
    } catch (error) {
        console.error('Error loading colleges:', error);
        // Use mock data for testing
        colleges = ['ABC College', 'XYZ University', 'PQR Institute'];
        populateCollegeDropdowns();
    }
}

// Populate college dropdowns
function populateCollegeDropdowns() {
    const collegeSelect = $('#collegeSelect');
    const filterSelect = $('#filterBatchCollege');

    // Store current values
    const currentCollegeValue = collegeSelect.val();
    const currentFilterValue = filterSelect.val();

    // Clear existing options
    collegeSelect.empty();
    filterSelect.empty();

    // Add placeholder options
    collegeSelect.append(new Option('Select or add new college...', '', false, false));
    filterSelect.append(new Option('All Colleges', '', false, false));

    // Add college options
    colleges.forEach(college => {
        collegeSelect.append(new Option(college, college, false, false));
        filterSelect.append(new Option(college, college, false, false));
    });

    // Restore previous selections
    if (currentCollegeValue) {
        collegeSelect.val(currentCollegeValue).trigger('change');
    }
    if (currentFilterValue) {
        filterSelect.val(currentFilterValue).trigger('change');
    }
}

// Handle add college
function handleAddCollege() {
    const newCollegeName = document.getElementById('newCollegeName').value.trim();

    if (!newCollegeName) {
        showToast('Please enter a college name', 'warning');
        return;
    }

    if (colleges.includes(newCollegeName)) {
        showToast('College already exists', 'warning');
        return;
    }

    colleges.push(newCollegeName);
    populateCollegeDropdowns();

    // Select the newly added college using Select2
    $('#collegeSelect').val(newCollegeName).trigger('change');

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('addCollegeModal')).hide();

    // Reset form
    document.getElementById('addCollegeForm').reset();

    showToast('College added successfully', 'success');
}

// Handle batch form submission
async function handleBatchSubmit(e) {
    e.preventDefault();

    const batchName = document.getElementById('batchName').value.trim();
    const college = document.getElementById('collegeSelect').value;
    const batchId = document.getElementById('batchId').value;

    if (!college) {
        showToast('Please select a college', 'warning');
        return;
    }

    try {
        showLoading('Creating batch...');

        const data = {
            batchName: batchName,
            college: college
        };

        if (batchId) {
            data.batchId = batchId;
        }

        const response = await apiCall('createBatch', 'POST', data);

        if (response.success) {
            showToast('Batch created successfully!', 'success');

            // Generate QR codes
            generateQRCodes(response.data);

            // Reload batch list
            await loadBatches();

            // Show QR section
            document.getElementById('qrCodeSection').style.display = 'block';
        } else {
            showToast('Failed to create batch', 'danger');
        }
    } catch (error) {
        console.error('Error creating batch:', error);

        // For testing without API, generate mock QR codes
        const mockData = {
            batchId: 'batch_' + Date.now(),
            batchName: batchName,
            college: college,
            enrollmentURL: `${CONFIG.APP_URL}/student/enroll.html?batch=batch_${Date.now()}&college=${encodeURIComponent(college)}`,
            attendanceURL: `${CONFIG.APP_URL}/student/attend.html?batch=batch_${Date.now()}`
        };

        generateQRCodes(mockData);
        showToast('Batch created (Test Mode)', 'success');

        // Add to local batch list for testing
        allBatches.unshift({
            ...mockData,
            createdDate: new Date().toISOString(),
            isActive: true
        });
        filteredBatches = [...allBatches];
        displayBatches();

        document.getElementById('qrCodeSection').style.display = 'block';
    } finally {
        hideLoading();
    }
}

// Generate QR codes
function generateQRCodes(batchData) {
    console.log('Generating QR codes for:', batchData);

    // Check if QRCode library is loaded
    if (typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded!');
        showToast('QR Code library failed to load. Please refresh the page.', 'danger');
        return;
    }

    // Clear existing QR codes
    const enrollmentCanvas = document.getElementById('enrollmentQR');
    const attendanceCanvas = document.getElementById('attendanceQR');

    if (!enrollmentCanvas || !attendanceCanvas) {
        console.error('QR code containers not found!');
        return;
    }

    enrollmentCanvas.innerHTML = '';
    attendanceCanvas.innerHTML = '';

    try {
        // Generate enrollment QR
        currentQRCodes.enrollment = new QRCode(enrollmentCanvas, {
            text: batchData.enrollmentURL || '',
            width: 200,
            height: 200,
            colorDark: '#333333',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        // Generate attendance QR
        currentQRCodes.attendance = new QRCode(attendanceCanvas, {
            text: batchData.attendanceURL || '',
            width: 200,
            height: 200,
            colorDark: '#333333',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        console.log('QR codes generated successfully');

        // Store batch ID
        document.getElementById('batchId').value = batchData.batchId;
    } catch (error) {
        console.error('Error generating QR codes:', error);
        showToast('Failed to generate QR codes: ' + error.message, 'danger');
    }
}

// Download QR code
function downloadQR(canvasId, type) {
    const canvas = document.querySelector(`#${canvasId} canvas`);
    const batchName = document.getElementById('batchName').value;

    if (canvas) {
        const link = document.createElement('a');
        link.download = `${batchName}_${type}_qr.png`;
        link.href = canvas.toDataURL();
        link.click();
    }
}

// Copy URL to clipboard
function copyURL(type) {
    const batch = allBatches.find(b => b.batchId === document.getElementById('batchId').value);

    if (!batch) {
        showToast('Please create or select a batch first', 'warning');
        return;
    }

    const url = type === 'enrollment' ? batch.enrollmentURL : batch.attendanceURL;

    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
        showToast(`${type === 'enrollment' ? 'Enrollment' : 'Attendance'} URL copied to clipboard!`, 'success');
    }).catch(err => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast(`${type === 'enrollment' ? 'Enrollment' : 'Attendance'} URL copied to clipboard!`, 'success');
        } catch (err) {
            showToast('Failed to copy URL', 'danger');
        }
        document.body.removeChild(textArea);
    });
}

// Load batches
async function loadBatches() {
    try {
        showLoading('Loading batches...');

        const response = await apiCall('getBatches', 'GET');

        if (response.success && response.data) {
            allBatches = response.data;
        } else {
            allBatches = [];
            showToast(response.message || 'Failed to load batches', 'warning');
        }

        filteredBatches = [...allBatches];
        displayBatches();
    } catch (error) {
        console.error('Error loading batches:', error);

        // Show error message instead of loading mock data
        allBatches = [];
        filteredBatches = [];
        displayBatches();
        showToast('Failed to load batches. Please check your connection.', 'danger');
    } finally {
        hideLoading();
    }
}

// Display batches
function displayBatches() {
    const batchList = document.getElementById('batchList');
    const emptyState = document.getElementById('emptyBatchState');

    if (filteredBatches.length === 0) {
        batchList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    const batchItems = filteredBatches.map(batch => `
        <div class="batch-item" onclick="selectBatch('${batch.batchId}')">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1">${batch.batchName}</h6>
                    <p class="mb-1 text-muted">
                        <i class="bi bi-building"></i> ${batch.college}
                    </p>
                    <small class="text-muted">
                        <i class="bi bi-calendar"></i> ${new Date(batch.createdDate).toLocaleDateString()}
                    </small>
                </div>
                <span class="badge ${batch.isActive ? 'bg-success' : 'bg-secondary'}">
                    ${batch.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
        </div>
    `).join('');

    batchList.innerHTML = batchItems;
}

// Select batch
function selectBatch(batchId) {
    const batch = allBatches.find(b => b.batchId === batchId);

    if (batch) {
        // Populate form
        document.getElementById('batchName').value = batch.batchName;
        $('#collegeSelect').val(batch.college).trigger('change');
        document.getElementById('batchId').value = batch.batchId;

        // Generate QR codes
        generateQRCodes(batch);

        // Show QR section
        document.getElementById('qrCodeSection').style.display = 'block';

        // Update button text
        document.getElementById('saveBatchBtn').innerHTML = '<i class="bi bi-pencil"></i> Update Batch';

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Filter batch list
function filterBatchList() {
    const searchTerm = document.getElementById('searchBatch').value.toLowerCase();
    const collegeFilter = document.getElementById('filterBatchCollege').value;

    filteredBatches = allBatches.filter(batch => {
        const matchesSearch = batch.batchName.toLowerCase().includes(searchTerm) ||
                            batch.college.toLowerCase().includes(searchTerm);
        const matchesCollege = !collegeFilter || batch.college === collegeFilter;

        return matchesSearch && matchesCollege;
    });

    displayBatches();
}

// Reset form
function resetForm() {
    document.getElementById('batchForm').reset();
    document.getElementById('batchId').value = '';
    document.getElementById('qrCodeSection').style.display = 'none';
    document.getElementById('saveBatchBtn').innerHTML = '<i class="bi bi-save"></i> Create Batch';
    generateNewBatchName();
}

// Mock data for testing
function getMockBatches() {
    return [
        {
            batchId: 'batch_001',
            batchName: 'BATCH_5X8A9B',
            college: 'ABC College',
            createdDate: '2025-10-15T10:00:00Z',
            enrollmentURL: `${CONFIG.APP_URL}/student/enroll.html?batch=batch_001&college=ABC+College`,
            attendanceURL: `${CONFIG.APP_URL}/student/attend.html?batch=batch_001`,
            isActive: true
        },
        {
            batchId: 'batch_002',
            batchName: 'BATCH_3K7M2N',
            college: 'XYZ University',
            createdDate: '2025-10-16T11:30:00Z',
            enrollmentURL: `${CONFIG.APP_URL}/student/enroll.html?batch=batch_002&college=XYZ+University`,
            attendanceURL: `${CONFIG.APP_URL}/student/attend.html?batch=batch_002`,
            isActive: true
        }
    ];
}
