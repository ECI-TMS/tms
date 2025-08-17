let selectedBulkFile = null;

// Initialize page
$(document).ready(function() {
  setupEventListeners();
  setupUserTypeHandler();
});

function setupEventListeners() {
  // Single user form submission
  document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    createSingleUser();
  });

  // Bulk file input handler
  document.getElementById('bulkFileInput').addEventListener('change', function(e) {
    handleBulkFileSelect(e.target.files);
  });

  // Drag and drop functionality for bulk upload
  const bulkUploadArea = document.getElementById('bulkUploadArea');

  bulkUploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    bulkUploadArea.classList.add('dragover');
  });

  bulkUploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    bulkUploadArea.classList.remove('dragover');
  });

  bulkUploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    bulkUploadArea.classList.remove('dragover');
    handleBulkFileSelect(e.dataTransfer.files);
  });

  // Close modal when clicking outside
  document.getElementById('bulkUploadModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeBulkUploadModal();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('bulkUploadModal').classList.contains('active')) {
      closeBulkUploadModal();
    }
  });
}

function setupUserTypeHandler() {
  const userTypeSelect = document.getElementById('userTypeSelect');
  const programSelect = document.getElementById('programSelect');
  
  userTypeSelect.addEventListener('change', function() {
    if (this.value === 'TRAINER') {
      programSelect.required = true;
      programSelect.parentElement.style.display = 'block';
    } else {
      programSelect.required = false;
      programSelect.parentElement.style.display = 'block';
    }
  });
}

// Show/Hide Forms
function showSingleUserForm() {
  document.getElementById('singleUserForm').style.display = 'block';
}

function showBulkUploadModal() {
  document.getElementById('bulkUploadModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeBulkUploadModal() {
  document.getElementById('bulkUploadModal').classList.remove('active');
  document.body.style.overflow = 'auto';
  resetBulkUpload();
}

// Single User Creation
async function createSingleUser() {
  const form = document.getElementById('userForm');
  const formData = new FormData(form);
  const submitBtn = document.getElementById('submitBtn');
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Creating User...';

  try {
    const response = await fetch('/admin/user/create', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      alert('User created successfully!');
      resetForm();
    } else {
      alert(`Error: ${result.message || 'Failed to create user'}`);
    }
  } catch (error) {
    console.error('Error creating user:', error);
    alert('Failed to create user. Please try again.');
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17,21 17,13 7,13 7,21"/>
        <polyline points="7,3 7,8 15,8"/>
      </svg>
      Create User
    `;
  }
}

function resetForm() {
  document.getElementById('userForm').reset();
  document.getElementById('programSelect').required = false;
}

// Bulk Upload Functions
function handleBulkFileSelect(files) {
  if (files.length > 0) {
    const file = files[0];
    
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    selectedBulkFile = file;
    updateBulkFileDisplay();
    validateBulkForm();
  }
}

function updateBulkFileDisplay() {
  const fileList = document.getElementById('bulkFileList');
  const fileItems = document.getElementById('bulkFileItems');
  const uploadBtn = document.getElementById('bulkUploadBtn');

  if (selectedBulkFile) {
    fileList.style.display = 'block';
    
    fileItems.innerHTML = `
      <div class="file-item">
        <div class="file-info">
          <div class="file-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E5A92" stroke-width="2">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
          <div>
            <div style="font-weight: 600; color: var(--primary-blue-dark);">
              ${selectedBulkFile.name}
            </div>
            <div class="file-size">${formatFileSize(selectedBulkFile.size)}</div>
          </div>
        </div>
        <button class="remove-file" onclick="removeBulkFile()" title="Remove file">
          ×
        </button>
      </div>
    `;
  } else {
    fileList.style.display = 'none';
  }
}

function removeBulkFile() {
  selectedBulkFile = null;
  document.getElementById('bulkFileInput').value = '';
  updateBulkFileDisplay();
  validateBulkForm();
}

function validateBulkForm() {
  const uploadBtn = document.getElementById('bulkUploadBtn');
  uploadBtn.disabled = !selectedBulkFile;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadBulkUsers() {
  if (!selectedBulkFile) {
    alert('Please select an Excel file');
    return;
  }

  const uploadBtn = document.getElementById('bulkUploadBtn');
  const uploadBtnText = document.getElementById('bulkUploadBtnText');
  
  // Show loading state
  uploadBtn.disabled = true;
  uploadBtnText.innerHTML = '<span class="loading"></span> Uploading...';

  try {
    const formData = new FormData();
    formData.append('file', selectedBulkFile);

    const response = await fetch('/admin/user/bulk', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      alert(`Bulk upload completed successfully!\n${result.message}`);
      closeBulkUploadModal();
    } else {
      alert(`Upload failed: ${result.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed. Please try again.');
  } finally {
    // Reset button state
    uploadBtn.disabled = false;
    uploadBtnText.textContent = 'Upload Users';
  }
}

function resetBulkUpload() {
  selectedBulkFile = null;
  document.getElementById('bulkFileInput').value = '';
  document.getElementById('bulkFileList').style.display = 'none';
  document.getElementById('bulkUploadBtn').disabled = true;
}

// Template Download
function downloadTemplate() {
  // Create sample data for the template
  const sampleData = [
    {
      email: 'trainer1@example.com',
      password: 'password123',
      username: 'trainer1',
      usertype: 'TRAINER',
      program_id: '1'
    },
    {
      email: 'admin1@example.com',
      password: 'password123',
      username: 'admin1',
      usertype: 'ADMIN',
      program_id: ''
    },
    {
      email: 'student1@example.com',
      password: 'password123',
      username: 'student1',
      usertype: 'STUDENT',
      program_id: ''
    }
  ];

  // Convert to CSV format
  const headers = ['email', 'password', 'username', 'usertype', 'program_id'];
  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => headers.map(header => row[header]).join(','))
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'user_bulk_upload_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
