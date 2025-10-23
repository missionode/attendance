// API Configuration
const CONFIG = {
    // Replace this with your Google Apps Script Web App URL after deployment
    API_BASE_URL: 'https://script.google.com/macros/s/AKfycbzX9f7s90PrS4DGOuquScGwCN7lIjK805zytbhhTr2KhpzAvEOJ8uiQumbM_PgBFd_LFQ/exec',

    
    // Google OAuth Configuration
    GOOGLE_CLIENT_ID: '489612117645-1nc1fpakposld1s2eae392rjn46424r9.apps.googleusercontent.com',

    // App Configuration
    APP_NAME: 'Student Session Management System',
    VERSION: '1.0.0',

    // Deployment URL (update this with your GitHub Pages URL)
    APP_URL: 'https://missionode.github.io/attendance'
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const url = new URL(CONFIG.API_BASE_URL);
        url.searchParams.append('action', endpoint);

        const options = {
            method: method,
            mode: 'cors',
        };

        if (data && method === 'POST') {
            url.searchParams.append('data', JSON.stringify(data));
        } else if (data && method === 'GET') {
            Object.keys(data).forEach(key => {
                url.searchParams.append(key, data[key]);
            });
        }

        const response = await fetch(url.toString(), options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Show loading spinner
function showLoading(message = 'Loading...') {
    const loadingHtml = `
        <div class="loading-overlay" id="loadingOverlay">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">${message}</p>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHtml);
}

// Hide loading spinner
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0 position-fixed top-0 end-0 m-3" role="alert" style="z-index: 9999;">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toastHtml);

    const toastElement = document.querySelector('.toast:last-child');
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Generate random batch name
function generateBatchName() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let batchName = 'BATCH_';
    for (let i = 0; i < 6; i++) {
        batchName += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return batchName;
}

// Format date to YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}
