let allBatches = [];
let filteredBatches = [];
let colleges = [];
let currentQRCodes = {
    enrollment: null,
    attendance: null
};
let currentBatchData = null;
let currentDailyToken = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadColleges();
    loadBatches();
    setupEventListeners();
    generateNewBatchName();
    initializeSearchableSelects();
    setTodayDate();
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

    // Live search as user types in new college name input
    document.getElementById('newCollegeName').addEventListener('input', filterExistingColleges);

    // Modal show event - populate existing colleges list
    const addCollegeModal = document.getElementById('addCollegeModal');
    addCollegeModal.addEventListener('show.bs.modal', populateExistingCollegesList);
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

// Populate existing colleges list in modal
function populateExistingCollegesList() {
    const container = document.getElementById('existingCollegesList');
    const noCollegesMessage = document.getElementById('noCollegesMessage');

    // Clear new college input
    document.getElementById('newCollegeName').value = '';

    if (colleges.length === 0) {
        container.innerHTML = '';
        noCollegesMessage.style.display = 'block';
        return;
    }

    noCollegesMessage.style.display = 'none';

    const collegeItems = colleges.map(college => `
        <div class="college-list-item" data-college="${college}">
            <div class="college-list-item-content" data-college="${college}">
                <i class="bi bi-building"></i>
                <span>${college}</span>
            </div>
            <div class="college-list-item-actions">
                <button class="college-action-btn edit-btn" data-college="${college}" title="Edit college name">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="college-action-btn delete-btn" data-college="${college}" title="Delete college">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = collegeItems;

    // Add click listeners to college items for selection
    container.querySelectorAll('.college-list-item-content').forEach(item => {
        item.addEventListener('click', function() {
            selectExistingCollege(this.getAttribute('data-college'));
        });
    });

    // Add click listeners for edit buttons
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            editCollege(this.getAttribute('data-college'));
        });
    });

    // Add click listeners for delete buttons
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteCollege(this.getAttribute('data-college'));
        });
    });
}

// Filter existing colleges list as user types
function filterExistingColleges() {
    const searchTerm = document.getElementById('newCollegeName').value.toLowerCase().trim();
    const container = document.getElementById('existingCollegesList');
    const noCollegesMessage = document.getElementById('noCollegesMessage');
    const items = container.querySelectorAll('.college-list-item');

    // If search is empty, show all colleges
    if (searchTerm === '') {
        items.forEach(item => {
            item.style.display = 'block';
        });
        noCollegesMessage.style.display = 'none';
        return;
    }

    let visibleCount = 0;

    items.forEach(item => {
        const collegeName = item.getAttribute('data-college').toLowerCase();
        if (collegeName.includes(searchTerm)) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    // Show/hide no results message
    if (visibleCount === 0 && searchTerm !== '') {
        noCollegesMessage.style.display = 'block';
    } else {
        noCollegesMessage.style.display = 'none';
    }
}

// Select existing college from modal
function selectExistingCollege(collegeName) {
    // Set the selected college in the main dropdown using Select2
    $('#collegeSelect').val(collegeName).trigger('change');

    // Close the modal
    bootstrap.Modal.getInstance(document.getElementById('addCollegeModal')).hide();

    // Show success message
    showToast(`"${collegeName}" selected`, 'success');
}

// Edit college name
async function editCollege(oldCollegeName) {
    // Prompt user for new college name
    const newCollegeName = prompt('Edit college name:', oldCollegeName);

    if (!newCollegeName) {
        return; // User cancelled
    }

    const trimmedName = newCollegeName.trim();

    if (trimmedName === oldCollegeName) {
        return; // No change
    }

    if (!trimmedName) {
        showToast('College name cannot be empty', 'warning');
        return;
    }

    // Check if new name already exists
    if (colleges.includes(trimmedName)) {
        showToast('A college with this name already exists', 'warning');
        return;
    }

    try {
        showLoading('Updating college name...');

        const response = await apiCall('updateCollege', 'POST', {
            oldName: oldCollegeName,
            newName: trimmedName
        });

        if (response.success) {
            // Update college name in local array
            const index = colleges.indexOf(oldCollegeName);
            if (index !== -1) {
                colleges[index] = trimmedName;
            }

            // Update dropdowns
            populateCollegeDropdowns();

            // Update the colleges list in modal
            populateExistingCollegesList();

            // If the old college was selected, update to new name
            const currentSelection = $('#collegeSelect').val();
            if (currentSelection === oldCollegeName) {
                $('#collegeSelect').val(trimmedName).trigger('change');
            }

            // Reload batches to reflect updated college names
            await loadBatches();

            showToast('College name updated successfully across all records', 'success');
        } else {
            showToast(response.message || 'Failed to update college name', 'danger');
        }
    } catch (error) {
        console.error('Error updating college:', error);
        showToast('Failed to update college. Please check your connection.', 'danger');
    } finally {
        hideLoading();
    }
}

// Delete college
async function deleteCollege(collegeName) {
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${collegeName}"?\n\nNote: You can only delete colleges that have no associated batches.`)) {
        return;
    }

    try {
        showLoading('Deleting college...');

        const response = await apiCall('deleteCollege', 'POST', {
            collegeName: collegeName
        });

        if (response.success) {
            // Check if this college is currently selected
            const currentSelection = $('#collegeSelect').val();

            // Remove from colleges array
            const index = colleges.indexOf(collegeName);
            if (index !== -1) {
                colleges.splice(index, 1);
            }

            // Update dropdowns
            populateCollegeDropdowns();

            // Update the colleges list in modal
            populateExistingCollegesList();

            // Clear selection if deleted college was selected
            if (currentSelection === collegeName) {
                $('#collegeSelect').val('').trigger('change');
            }

            // Reload batches
            await loadBatches();

            showToast('College removed successfully', 'success');
        } else {
            showToast(response.message || 'Failed to delete college', 'warning');
        }
    } catch (error) {
        console.error('Error deleting college:', error);
        showToast('Failed to delete college. Please check your connection.', 'danger');
    } finally {
        hideLoading();
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

// Note: generateQRCodes function moved to end of file with daily QR support

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

// Note: copyURL function moved to end of file with daily token support

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

// Set today's date in the date picker
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) {
        dateInput.value = today;
    }
}

// Generate daily attendance QR code
async function generateDailyQR() {
    const batchId = document.getElementById('batchId').value;
    const dateInput = document.getElementById('attendanceDate').value;

    if (!batchId) {
        showToast('Please create or select a batch first', 'warning');
        return;
    }

    if (!dateInput) {
        showToast('Please select a date', 'warning');
        return;
    }

    try {
        showLoading('Generating daily attendance token...');

        const response = await apiCall('generateDailyAttendanceToken', 'POST', {
            batchId: batchId,
            date: dateInput
        });

        if (response.success && response.data) {
            currentDailyToken = response.data;

            // Clear existing QR
            const attendanceCanvas = document.getElementById('attendanceQR');
            attendanceCanvas.innerHTML = '';

            // Generate QR code
            currentQRCodes.attendance = new QRCode(attendanceCanvas, {
                text: response.data.attendanceURL,
                width: 200,
                height: 200,
                colorDark: '#333333',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });

            // Show QR info
            document.getElementById('attendanceQRLabel').style.display = 'block';
            document.getElementById('attendanceQRDate').style.display = 'block';
            document.getElementById('attendanceQRActions').style.display = 'flex';

            const dateObj = new Date(dateInput);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            document.getElementById('attendanceQRDate').textContent = `Valid for: ${formattedDate}`;

            if (response.data.alreadyExists) {
                showToast('Using existing token for this date', 'info');
            } else {
                showToast('Daily attendance QR generated successfully!', 'success');
            }
        } else {
            showToast(response.message || 'Failed to generate token', 'danger');
        }
    } catch (error) {
        console.error('Error generating daily QR:', error);
        showToast('Failed to generate daily QR. Please try again.', 'danger');
    } finally {
        hideLoading();
    }
}

// Modified generateQRCodes to only generate enrollment QR
function generateQRCodes(batchData) {
    console.log('Generating enrollment QR for:', batchData);

    currentBatchData = batchData;

    // Check if QRCode library is loaded
    if (typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded!');
        showToast('QR Code library failed to load. Please refresh the page.', 'danger');
        return;
    }

    // Clear existing enrollment QR
    const enrollmentCanvas = document.getElementById('enrollmentQR');

    if (!enrollmentCanvas) {
        console.error('QR code container not found!');
        return;
    }

    enrollmentCanvas.innerHTML = '';

    try {
        // Generate enrollment QR only
        currentQRCodes.enrollment = new QRCode(enrollmentCanvas, {
            text: batchData.enrollmentURL || '',
            width: 200,
            height: 200,
            colorDark: '#333333',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        console.log('Enrollment QR code generated successfully');

        // Store batch ID
        document.getElementById('batchId').value = batchData.batchId;

        // Set today's date for attendance QR
        setTodayDate();

        // Hide attendance QR until generated
        document.getElementById('attendanceQRLabel').style.display = 'none';
        document.getElementById('attendanceQRDate').style.display = 'none';
        document.getElementById('attendanceQRActions').style.display = 'none';

        // Clear attendance QR
        const attendanceCanvas = document.getElementById('attendanceQR');
        if (attendanceCanvas) {
            attendanceCanvas.innerHTML = '';
        }
    } catch (error) {
        console.error('Error generating QR codes:', error);
        showToast('Failed to generate QR codes: ' + error.message, 'danger');
    }
}

// Modified copyURL to handle daily attendance tokens
function copyURL(type) {
    let url;

    if (type === 'enrollment') {
        const batch = allBatches.find(b => b.batchId === document.getElementById('batchId').value);
        if (!batch) {
            showToast('Please create or select a batch first', 'warning');
            return;
        }
        url = batch.enrollmentURL;
    } else if (type === 'attendance') {
        if (!currentDailyToken || !currentDailyToken.attendanceURL) {
            showToast('Please generate a daily attendance QR first', 'warning');
            return;
        }
        url = currentDailyToken.attendanceURL;
    }

    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
        showToast(`${type === 'enrollment' ? 'Enrollment' : 'Daily Attendance'} URL copied to clipboard!`, 'success');
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
            showToast(`${type === 'enrollment' ? 'Enrollment' : 'Daily Attendance'} URL copied to clipboard!`, 'success');
        } catch (err) {
            showToast('Failed to copy URL', 'danger');
        }
        document.body.removeChild(textArea);
    });
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
