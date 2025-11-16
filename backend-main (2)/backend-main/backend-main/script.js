// API Configuration
const API_BASE_URL = 'http://localhost:8000';
let accessToken = localStorage.getItem('abha_access_token');
let currentUser = JSON.parse(localStorage.getItem('abha_user') || 'null');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    setupEventListeners();
    initializeTheme();
    showWelcomeAnimation();
});

// Welcome Animation
function showWelcomeAnimation() {
    const elements = document.querySelectorAll('.premium-card, .glass-card');
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        setTimeout(() => {
            el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Theme Management
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const isDark = localStorage.getItem('theme') === 'dark';
    
    if (isDark) {
        document.documentElement.classList.add('dark');
        themeToggle.innerHTML = '<i class="fas fa-sun text-gray-600"></i>';
    }
    
    themeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
        document.documentElement.classList.remove('dark');
        themeToggle.innerHTML = '<i class="fas fa-moon text-gray-600"></i>';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        themeToggle.innerHTML = '<i class="fas fa-sun text-gray-600"></i>';
        localStorage.setItem('theme', 'dark');
    }
}

// Authentication Management
function initializeAuth() {
    if (accessToken && currentUser) {
        updateAuthStatus(true, currentUser);
        updateNavAuthStatus(true, currentUser);
        showProfile(currentUser);
    }
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Search inputs with Enter key support
    document.getElementById('namasteSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchNamaste();
    });
    
    document.getElementById('icdSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchICD();
    });
    
    document.getElementById('sourceCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') translateCode();
    });

    // Add input animations
    const inputs = document.querySelectorAll('.premium-input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
}

// Enhanced Loading System
function showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    messageEl.textContent = message;
    overlay.classList.remove('hidden');
    
    // Add entrance animation
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
}

// Toast Notification System
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
        success: 'fas fa-check-circle text-green-500',
        error: 'fas fa-exclamation-circle text-red-500',
        info: 'fas fa-info-circle text-blue-500',
        warning: 'fas fa-exclamation-triangle text-yellow-500'
    }[type];
    
    toast.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="${icon}"></i>
            <div>
                <p class="font-medium text-gray-900">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Show animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const abhaId = document.getElementById('abhaId').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    if (!abhaId || !phone) {
        showToast('Please enter both ABHA ID and phone number', 'error');
        return;
    }
    
    try {
        showLoading('Authenticating with ABHA...');
        
        const response = await fetch(`${API_BASE_URL}/abha/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                abha_id: abhaId,
                phone: phone
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            accessToken = data.access_token;
            currentUser = data.abha_user;
            
            // Store in localStorage
            localStorage.setItem('abha_access_token', accessToken);
            localStorage.setItem('abha_user', JSON.stringify(currentUser));
            
            updateAuthStatus(true, currentUser);
            updateNavAuthStatus(true, currentUser);
            showProfile(currentUser);
            showToast(`Welcome back, ${currentUser.name}!`, 'success');
            
            // Clear form and add success animation
            document.getElementById('loginForm').reset();
            animateSuccess();
        } else {
            showToast(data.detail || 'Authentication failed', 'error');
        }
    } catch (error) {
        showToast('Network error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function handleLogout() {
    accessToken = null;
    currentUser = null;
    
    // Clear localStorage
    localStorage.removeItem('abha_access_token');
    localStorage.removeItem('abha_user');
    
    updateAuthStatus(false);
    updateNavAuthStatus(false);
    hideProfile();
    clearResults();
    showToast('Successfully logged out', 'info');
}

function updateAuthStatus(isAuthenticated, user = null) {
    const statusElement = document.getElementById('authStatus');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (isAuthenticated && user) {
        statusElement.innerHTML = `
            <div class="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div class="flex-shrink-0">
                    <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                </div>
                <div class="flex-1">
                    <p class="font-semibold text-green-800">Authentication Successful</p>
                    <p class="text-sm text-green-600">Welcome, ${user.name} (${user.abha_id})</p>
                </div>
                <div class="flex-shrink-0">
                    <i class="fas fa-shield-alt text-green-500 text-xl"></i>
                </div>
            </div>
        `;
        logoutBtn.style.display = 'inline-flex';
        
        // Hide login inputs
        const inputs = loginForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.parentElement.style.display = 'none';
        });
        loginForm.querySelector('button[type="submit"]').style.display = 'none';
    } else {
        statusElement.innerHTML = `
            <div class="flex items-center space-x-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                <div class="flex-shrink-0">
                    <div class="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                    <p class="font-medium text-red-800">Authentication Required</p>
                    <p class="text-sm text-red-600">Please login to access all features</p>
                </div>
            </div>
        `;
        logoutBtn.style.display = 'none';
        
        // Show login inputs
        const inputs = loginForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.parentElement.style.display = 'block';
        });
        loginForm.querySelector('button[type="submit"]').style.display = 'inline-flex';
    }
}

function updateNavAuthStatus(isAuthenticated, user = null) {
    const navStatus = document.getElementById('authStatusNav');
    
    if (isAuthenticated && user) {
        navStatus.innerHTML = `
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
            <span class="text-sm text-gray-700 font-medium">${user.name}</span>
        `;
    } else {
        navStatus.innerHTML = `
            <div class="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span class="text-sm text-gray-600">Not Connected</span>
        `;
    }
}

function showProfile(user) {
    const profileSection = document.getElementById('profileSection');
    const profileData = document.getElementById('profileData');
    
    const profileFields = [
        { label: 'ABHA ID', value: user.abha_id, icon: 'fas fa-id-card' },
        { label: 'Full Name', value: user.name, icon: 'fas fa-user' },
        { label: 'Email Address', value: user.email, icon: 'fas fa-envelope' },
        { label: 'Phone Number', value: user.phone, icon: 'fas fa-phone' },
        { label: 'Date of Birth', value: user.dob, icon: 'fas fa-calendar' },
        { label: 'Gender', value: user.gender === 'M' ? 'Male' : 'Female', icon: 'fas fa-venus-mars' },
        { label: 'Address', value: user.address, icon: 'fas fa-map-marker-alt' },
        { label: 'Member Since', value: new Date(user.created_at).toLocaleDateString(), icon: 'fas fa-clock' }
    ];
    
    profileData.innerHTML = profileFields.map(field => `
        <div class="profile-item">
            <div class="profile-label">
                <i class="${field.icon} mr-2"></i>${field.label}
            </div>
            <div class="profile-value">${field.value}</div>
        </div>
    `).join('');
    
    profileSection.style.display = 'block';
    
    // Add entrance animation
    setTimeout(() => {
        profileSection.style.opacity = '0';
        profileSection.style.transform = 'translateY(20px)';
        profileSection.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            profileSection.style.opacity = '1';
            profileSection.style.transform = 'translateY(0)';
        }, 10);
    }, 100);
}

function hideProfile() {
    document.getElementById('profileSection').style.display = 'none';
}

function animateSuccess() {
    const authStatus = document.getElementById('authStatus');
    authStatus.style.transform = 'scale(1.02)';
    setTimeout(() => {
        authStatus.style.transform = 'scale(1)';
    }, 200);
}

// Enhanced Search Functions
async function searchNamaste() {
    const query = document.getElementById('namasteSearch').value.trim();
    if (!query) {
        showToast('Please enter a search term', 'warning');
        return;
    }
    
    try {
        showLoading('Searching NAMASTE database...');
        
        const response = await fetch(`${API_BASE_URL}/namaste/namaste/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        displayApiResponse(data);
        
        if (response.ok && data.concepts) {
            displaySearchResults('namasteResults', data.concepts, 'NAMASTE', 'blue');
            showToast(`Found ${data.concepts.length} NAMASTE results`, 'success');
        } else {
            showToast('Search failed', 'error');
        }
    } catch (error) {
        showToast('Network error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function searchICD() {
    const query = document.getElementById('icdSearch').value.trim();
    if (!query) {
        showToast('Please enter a search term', 'warning');
        return;
    }
    
    try {
        showLoading('Searching ICD-11 database...');
        
        const response = await fetch(`${API_BASE_URL}/icd/icd11/tm2/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        displayApiResponse(data);
        
        if (response.ok && data.concepts) {
            displaySearchResults('icdResults', data.concepts, 'ICD-11', 'green');
            showToast(`Found ${data.concepts.length} ICD-11 results`, 'success');
        } else {
            showToast('Search failed', 'error');
        }
    } catch (error) {
        showToast('Network error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displaySearchResults(containerId, concepts, systemName, colorTheme) {
    const container = document.getElementById(containerId);
    
    if (!concepts || concepts.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-32 text-gray-500">
                <div class="text-center">
                    <i class="fas fa-search text-3xl mb-2 opacity-50"></i>
                    <p>No results found</p>
                </div>
            </div>
        `;
        return;
    }
    
    const colorClasses = {
        blue: 'from-blue-500 to-indigo-500',
        green: 'from-green-500 to-emerald-500',
        purple: 'from-purple-500 to-pink-500'
    };
    
    const resultsHtml = concepts.map((concept, index) => `
        <div class="result-item" style="animation-delay: ${index * 50}ms">
            <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r ${colorClasses[colorTheme]} rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <i class="fas fa-code text-white text-sm"></i>
                </div>
                <div class="flex-1">
                    <div class="result-code">${concept.code}</div>
                    <div class="result-display">${concept.display}</div>
                    ${concept.definition ? `<div class="result-definition">${concept.definition}</div>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="p-4">
            <div class="flex items-center space-x-2 mb-4">
                <i class="fas fa-list-ul text-${colorTheme}-500"></i>
                <h4 class="font-semibold text-gray-900">Found ${concepts.length} ${systemName} result(s)</h4>
            </div>
            ${resultsHtml}
        </div>
    `;
    
    // Add stagger animation
    const items = container.querySelectorAll('.result-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
            item.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

// Enhanced Translation Functions
async function translateCode() {
    const system = document.getElementById('sourceSystem').value;
    const code = document.getElementById('sourceCode').value.trim();
    const saveHistory = document.getElementById('saveHistory').checked;
    
    if (!code) {
        showToast('Please enter a source code', 'warning');
        return;
    }
    
    if (saveHistory && !accessToken) {
        showToast('Please login to save translation history', 'warning');
        return;
    }
    
    try {
        showLoading('Translating medical codes...');
        
        let url = `${API_BASE_URL}/mapping/translate?system=${system}&code=${encodeURIComponent(code)}`;
        if (saveHistory) {
            url += '&save_history=true';
        }
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (saveHistory && accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        const response = await fetch(url, { headers });
        const data = await response.json();
        
        displayApiResponse(data);
        
        if (response.ok) {
            displayTranslationResults(data);
            if (saveHistory) {
                showToast('Translation completed and saved to history', 'success');
            } else {
                showToast('Translation completed successfully', 'success');
            }
        } else {
            showToast(data.detail || 'Translation failed', 'error');
        }
    } catch (error) {
        showToast('Network error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayTranslationResults(data) {
    const container = document.getElementById('translationResults');
    
    if (!data.mappings || data.mappings.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-32 text-gray-500">
                <div class="text-center">
                    <i class="fas fa-exchange-alt text-3xl mb-2 opacity-50"></i>
                    <p>No mappings found</p>
                </div>
            </div>
        `;
        return;
    }
    
    const mappingsHtml = data.mappings.map((mapping, index) => `
        <div class="mapping-item" style="animation-delay: ${index * 100}ms">
            <div class="mapping-header">
                <div class="mapping-codes">
                    <i class="fas fa-arrow-right mx-2 text-gray-400"></i>
                    ${mapping.source_code} → ${mapping.target_code}
                </div>
                <div class="mapping-relationship">
                    <i class="fas fa-link mr-1"></i>
                    ${mapping.relationship}
                </div>
            </div>
            <div class="mapping-details">
                <div class="mapping-detail">
                    <div class="mapping-detail-label">
                        <i class="fas fa-stethoscope mr-1"></i>
                        SNOMED CT
                    </div>
                    <div class="mapping-detail-value">${mapping.snomed_ct_code}</div>
                </div>
                <div class="mapping-detail">
                    <div class="mapping-detail-label">
                        <i class="fas fa-flask mr-1"></i>
                        LOINC
                    </div>
                    <div class="mapping-detail-value">${mapping.loinc_code}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="p-4">
            <div class="flex items-center space-x-2 mb-4">
                <i class="fas fa-exchange-alt text-purple-500"></i>
                <h4 class="font-semibold text-gray-900">Translation Results (${data.mappings.length} mapping(s))</h4>
            </div>
            ${mappingsHtml}
        </div>
    `;
    
    // Add stagger animation
    const items = container.querySelectorAll('.mapping-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
            item.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Enhanced History Functions
async function loadHistory() {
    if (!accessToken) {
        showToast('Please login to view translation history', 'warning');
        return;
    }
    
    try {
        showLoading('Loading translation history...');
        
        const response = await fetch(`${API_BASE_URL}/abha/translation-history`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        
        displayApiResponse(data);
        
        if (response.ok) {
            displayHistoryResults(data.history);
            showToast(`Loaded ${data.history.length} history items`, 'success');
        } else {
            showToast(data.detail || 'Failed to load history', 'error');
        }
    } catch (error) {
        showToast('Network error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayHistoryResults(history) {
    const container = document.getElementById('historyResults');
    
    if (!history || history.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-32 text-gray-500">
                <div class="text-center">
                    <i class="fas fa-history text-3xl mb-2 opacity-50"></i>
                    <p>No translation history found</p>
                    <p class="text-sm mt-1">Start translating codes to build your history</p>
                </div>
            </div>
        `;
        return;
    }
    
    const historyHtml = history.map((item, index) => `
        <div class="history-item" style="animation-delay: ${index * 75}ms">
            <div class="history-header">
                <div class="history-id">
                    <i class="fas fa-hashtag mr-1 text-blue-400"></i>
                    ${item.id}
                </div>
                <div class="history-timestamp">
                    <i class="fas fa-clock mr-1"></i>
                    ${new Date(item.timestamp).toLocaleString()}
                </div>
            </div>
            <div class="history-translation">
                <div class="mapping-detail">
                    <div class="mapping-detail-label">
                        <i class="fas fa-play mr-1"></i>
                        Source
                    </div>
                    <div class="mapping-detail-value">${item.source_system}: ${item.source_code}</div>
                </div>
                <div class="mapping-detail">
                    <div class="mapping-detail-label">
                        <i class="fas fa-bullseye mr-1"></i>
                        Target
                    </div>
                    <div class="mapping-detail-value">${item.target_system}: ${item.target_code}</div>
                </div>
                <div class="mapping-detail">
                    <div class="mapping-detail-label">
                        <i class="fas fa-stethoscope mr-1"></i>
                        SNOMED CT
                    </div>
                    <div class="mapping-detail-value">${item.snomed_ct_code}</div>
                </div>
                <div class="mapping-detail">
                    <div class="mapping-detail-label">
                        <i class="fas fa-flask mr-1"></i>
                        LOINC
                    </div>
                    <div class="mapping-detail-value">${item.loinc_code}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="p-4">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-history text-orange-500"></i>
                    <h4 class="font-semibold text-gray-900">Translation History (${history.length} item(s))</h4>
                </div>
                <div class="text-sm text-gray-500">
                    <i class="fas fa-user mr-1"></i>
                    ${currentUser?.name || 'User'}
                </div>
            </div>
            ${historyHtml}
        </div>
    `;
    
    // Add stagger animation
    const items = container.querySelectorAll('.history-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
            item.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 75);
    });
}

// Enhanced API Response Display
function displayApiResponse(data) {
    const container = document.getElementById('apiResponse');
    const jsonString = JSON.stringify(data, null, 2);
    
    // Syntax highlighting
    const highlighted = jsonString
        .replace(/(".*?")\s*:/g, '<span style="color: #22d3ee;">$1</span>:')
        .replace(/:\s*(".*?")/g, ': <span style="color: #a3e635;">$1</span>')
        .replace(/:\s*(\d+)/g, ': <span style="color: #fbbf24;">$1</span>')
        .replace(/:\s*(true|false)/g, ': <span style="color: #f472b6;">$1</span>')
        .replace(/:\s*(null)/g, ': <span style="color: #94a3b8;">$1</span>');
    
    container.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
                <i class="fas fa-code text-blue-400"></i>
                <span class="text-sm font-medium text-gray-300">API Response</span>
            </div>
            <button onclick="copyToClipboard('${jsonString.replace(/'/g, "\\'")}', this)" 
                    class="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors">
                <i class="fas fa-copy mr-1"></i>Copy
            </button>
        </div>
        <pre class="text-sm leading-relaxed">${highlighted}</pre>
    `;
    
    // Add entrance animation
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';
    setTimeout(() => {
        container.style.transition = 'all 0.3s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 100);
}

// Utility Functions
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
        button.classList.add('bg-green-600');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('bg-green-600');
        }, 2000);
    });
}

function clearResults() {
    const containers = [
        'namasteResults', 'icdResults', 'translationResults', 
        'historyResults', 'apiResponse'
    ];
    
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = id === 'apiResponse' ? 
                `<div class="flex items-center justify-center h-32 text-gray-500">
                    <div class="text-center">
                        <i class="fas fa-code text-3xl mb-2 opacity-50"></i>
                        <p>API responses will appear here...</p>
                    </div>
                </div>` : '';
        }
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('namasteSearch').focus();
    }
    
    // Escape to clear results
    if (e.key === 'Escape') {
        clearResults();
    }
});

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Performance monitoring
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
        }
    });
}, { threshold: 0.1 });

// Observe all cards for scroll animations
document.querySelectorAll('.premium-card, .glass-card').forEach(card => {
    observer.observe(card);
});