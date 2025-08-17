// Global variables
let currentEditingUserId = null;
let dataTableInitialized = false;

// Wait for both jQuery and DataTable to be available
function initializeDataTable() {
    // Check if DataTable is already initialized
    if (dataTableInitialized) {
        console.log('DataTable already initialized, skipping...');
        return;
    }
    
    if (typeof $ !== 'undefined' && typeof $.fn.DataTable !== 'undefined') {
        console.log('Initializing DataTable for users...');
        
        // Check if table exists
        if ($('#usersTable').length > 0) {
            // Check if DataTable is already initialized on this table
            if ($.fn.DataTable.isDataTable('#usersTable')) {
                console.log('DataTable already initialized on this table, skipping...');
                dataTableInitialized = true;
                return;
            }
            
            console.log('Users table found, initializing DataTable...');
            
            // Initialize DataTable
            const dataTable = $('#usersTable').DataTable({
                responsive: true,
                pageLength: 10,
                lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
                order: [[5, 'desc']], // Sort by created date descending
                searching: true, // Explicitly enable searching
                search: {
                    smart: true,
                    regex: false,
                    caseInsensitive: true
                },
                columnDefs: [
                    { orderable: false, targets: [0, 6] } // Avatar and Actions columns not sortable
                ],
                language: {
                    search: "Search users:",
                    lengthMenu: "Show _MENU_ users per page",
                    info: "Showing _START_ to _END_ of _TOTAL_ users",
                    infoEmpty: "Showing 0 to 0 of 0 users",
                    infoFiltered: "(filtered from _MAX_ total users)",
                    paginate: {
                        first: "First",
                        last: "Last",
                        next: "Next",
                        previous: "Previous"
                    }
                },
                dom: '<"top"lf>rt<"bottom"ip><"clear">',
                autoWidth: false,
                scrollX: false
            });
            
            // Add search functionality debugging
            console.log('Search input found:', $('.dataTables_filter input').length);
            console.log('Search input selector:', $('.dataTables_filter input'));
            
            // Test search functionality
            $('.dataTables_filter input').on('keyup', function() {
                console.log('Search input value:', $(this).val());
                console.log('DataTable search method:', typeof dataTable.search);
            });
            
            // Manual search test function
            window.testSearch = function(searchTerm) {
                console.log('Testing search with term:', searchTerm);
                if (dataTable && typeof dataTable.search === 'function') {
                    dataTable.search(searchTerm).draw();
                    console.log('Search executed');
                } else {
                    console.error('DataTable search method not available');
                }
            };
            
            console.log('DataTable initialized successfully!');
            console.log('DataTable instance:', dataTable);
            console.log('Table has DataTable class:', $('#usersTable').hasClass('dataTable'));
            
            // Mark as initialized
            dataTableInitialized = true;
        } else {
            console.error('Users table not found!');
        }
    } else {
        console.log('jQuery or DataTable not available yet, retrying...');
        setTimeout(initializeDataTable, 100);
    }
}

$(document).ready(function() {
    console.log('Document ready, checking for DataTable...');
    initializeDataTable();
    
    // Setup edit form event listeners
    setupEditFormHandlers();
});

// Fallback initialization in case document.ready doesn't work
window.addEventListener('load', function() {
    console.log('Window loaded, checking DataTable again...');
    if (!dataTableInitialized && !$.fn.DataTable.isDataTable('#usersTable')) {
        console.log('DataTable not initialized, trying again...');
        initializeDataTable();
    } else {
        console.log('DataTable already initialized, skipping fallback...');
    }
});

// Setup edit form handlers
function setupEditFormHandlers() {
    const editUserType = document.getElementById('editUserType');
    const editProgramGroup = document.getElementById('editProgramGroup');
    const editUserForm = document.getElementById('editUserForm');

    if (editUserType) {
        editUserType.addEventListener('change', function() {
            if (this.value === 'TRAINER') {
                editProgramGroup.style.display = 'block';
                document.getElementById('editProgramID').required = true;
            } else {
                editProgramGroup.style.display = 'none';
                document.getElementById('editProgramID').required = false;
            }
        });
    }

    if (editUserForm) {
        editUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateUser();
        });
    }
}

// View user function
function viewUser(userId) {
    fetch(`/admin/user/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user details');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayUserDetails(data.user);
                document.getElementById('viewUserModal').style.display = 'block';
            } else {
                showNotification('Error loading user details', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading user details', 'error');
        });
}

// Display user details in modal
function displayUserDetails(user) {
    const modalBody = document.getElementById('viewUserModalBody');
    
    const avatarHtml = user.ProfilePicture 
        ? `<img src="${user.ProfilePicture}" alt="${user.Username}" class="user-detail-avatar">`
        : `<div class="user-detail-avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">
             ${user.Username.charAt(0).toUpperCase()}
           </div>`;

    const userTypeClass = `user-type-${user.UserType.toLowerCase()}`;
    
    modalBody.innerHTML = `
        <div class="user-details">
            <div class="user-detail-item">
                <div class="user-detail-label">Avatar:</div>
                <div class="user-detail-value">${avatarHtml}</div>
            </div>
            <div class="user-detail-item">
                <div class="user-detail-label">Username:</div>
                <div class="user-detail-value">${user.Username || 'N/A'}</div>
            </div>
            <div class="user-detail-item">
                <div class="user-detail-label">Email:</div>
                <div class="user-detail-value">${user.Email || 'N/A'}</div>
            </div>
            <div class="user-detail-item">
                <div class="user-detail-label">First Name:</div>
                <div class="user-detail-value">${user.FirstName || 'N/A'}</div>
            </div>
            <div class="user-detail-item">
                <div class="user-detail-label">Last Name:</div>
                <div class="user-detail-value">${user.LastName || 'N/A'}</div>
            </div>
            <div class="user-detail-item">
                <div class="user-detail-label">Contact Number:</div>
                <div class="user-detail-value">${user.ContactNumber || 'N/A'}</div>
            </div>
            <div class="user-detail-item">
                <div class="user-detail-label">User Type:</div>
                <div class="user-detail-value">
                    <span class="user-type-badge ${userTypeClass}">${user.UserType}</span>
                </div>
            </div>
            <div class="user-detail-item">
                <div class="user-detail-label">Program:</div>
                <div class="user-detail-value">${user.programName || 'N/A'}</div>
            </div>
            <div class="user-detail-item">
                <div class="user-detail-label">Created Date:</div>
                <div class="user-detail-value">${formatDate(user.createdAt) || 'N/A'}</div>
            </div>
        </div>
    `;
}

// Edit user function
function editUser(userId) {
    currentEditingUserId = userId;
    
    fetch(`/admin/user/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user details');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                populateEditForm(data.user);
                document.getElementById('editUserModal').style.display = 'block';
            } else {
                showNotification('Error loading user details', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading user details', 'error');
        });
}

// Populate edit form with user data
function populateEditForm(user) {
    document.getElementById('editUsername').value = user.Username || '';
    document.getElementById('editEmail').value = user.Email || '';
    document.getElementById('editFirstName').value = user.FirstName || '';
    document.getElementById('editLastName').value = user.LastName || '';
    document.getElementById('editContactNumber').value = user.ContactNumber || '';
    document.getElementById('editUserType').value = user.UserType || 'STUDENT';
    
    // Handle program selection
    const editProgramGroup = document.getElementById('editProgramGroup');
    const editProgramID = document.getElementById('editProgramID');
    
    if (user.UserType === 'TRAINER') {
        editProgramGroup.style.display = 'block';
        editProgramID.value = user.ProgramID || '';
        editProgramID.required = true;
    } else {
        editProgramGroup.style.display = 'none';
        editProgramID.value = '';
        editProgramID.required = false;
    }
}

// Update user function
function updateUser() {
    if (!currentEditingUserId) {
        showNotification('No user selected for editing', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('Username', document.getElementById('editUsername').value);
    formData.append('Email', document.getElementById('editEmail').value);
    formData.append('FirstName', document.getElementById('editFirstName').value);
    formData.append('LastName', document.getElementById('editLastName').value);
    formData.append('ContactNumber', document.getElementById('editContactNumber').value);
    formData.append('UserType', document.getElementById('editUserType').value);
    
    const programID = document.getElementById('editProgramID').value;
    if (programID) {
        formData.append('ProgramID', programID);
    }

    const profilePictureFile = document.getElementById('editProfilePicture').files[0];
    if (profilePictureFile) {
        formData.append('ProfilePicture', profilePictureFile);
    }

    // Show loading state
    const submitBtn = document.querySelector('#editUserForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Updating...';
    submitBtn.disabled = true;

    fetch(`/admin/user/${currentEditingUserId}/update`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('User updated successfully', 'success');
            closeEditModal();
            // Reload the page to refresh the table
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showNotification(data.message || 'Failed to update user', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating user', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Delete user function
function deleteUser(userId, username) {
    if (confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        fetch(`/admin/user/${userId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('User deleted successfully', 'success');
                // Reload the page to refresh the table
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification(data.message || 'Failed to delete user', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error deleting user', 'error');
        });
    }
}

// Close view modal
function closeViewModal() {
    document.getElementById('viewUserModal').style.display = 'none';
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editUserModal').style.display = 'none';
    currentEditingUserId = null;
    
    // Reset form
    document.getElementById('editUserForm').reset();
    document.getElementById('editProgramGroup').style.display = 'none';
    document.getElementById('editProgramID').required = false;
}

// Close modals when clicking outside
window.onclick = function(event) {
    const viewModal = document.getElementById('viewUserModal');
    const editModal = document.getElementById('editUserModal');
    
    if (event.target === viewModal) {
        closeViewModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
}

// Format date function
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                animation: slideInRight 0.3s ease-out;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 20px;
                color: white;
                font-weight: 500;
            }
            
            .notification-success {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }
            
            .notification-error {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            }
            
            .notification-info {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                margin-left: 10px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.3s ease;
            }
            
            .notification-close:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }
            
            .notification-message {
                flex: 1;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}
