let selectedFile = null;
const sessionId = window.sessionData.sessionId;
const programId = window.sessionData.programId;
const courseId = window.sessionData.courseId;

// Initialize page
$(document).ready(function() {
  // Set up event listeners
  setupEventListeners();
});

function setupEventListeners() {
  // File input handler
  document.getElementById('fileInput').addEventListener('change', function(e) {
    handleFileSelect(e.target.files);
  });

  // Drag and drop functionality
  const uploadArea = document.getElementById('uploadArea');

  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFileSelect(e.dataTransfer.files);
  });

  // Upload button handler
  document.getElementById('uploadButton').addEventListener('click', uploadMaterial);
}

function handleFileSelect(files) {
  if (files.length > 0) {
    selectedFile = files[0];
    updateFileDisplay();
    validateForm();
  }
}

function updateFileDisplay() {
  const fileList = document.getElementById('fileList');
  const fileItems = document.getElementById('fileItems');

  if (selectedFile) {
    fileList.style.display = 'block';
    
    fileItems.innerHTML = `
      <div class="file-item">
        <div class="file-info">
          <div class="file-icon">
            ${getFileIcon(selectedFile.name)}
          </div>
          <div>
            <div style="font-weight: 600; color: var(--primary-blue-dark);">
              ${selectedFile.name}
            </div>
            <div class="file-size">${formatFileSize(selectedFile.size)}</div>
          </div>
        </div>
        <button class="remove-file" onclick="removeFile()" title="Remove file">
          ×
        </button>
      </div>
    `;
  } else {
    fileList.style.display = 'none';
  }
}

function removeFile() {
  selectedFile = null;
  document.getElementById('fileInput').value = '';
  updateFileDisplay();
  validateForm();
}

function validateForm() {
  const uploadBtn = document.getElementById('uploadButton');
  
  uploadBtn.disabled = !selectedFile;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E5A92" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21,15 16,10 5,21"/>
    </svg>`;
  } else if (['pdf'].includes(extension)) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E5A92" stroke-width="2">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
    </svg>`;
  } else if (['doc', 'docx'].includes(extension)) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E5A92" stroke-width="2">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
    </svg>`;
  } else if (['ppt', 'pptx'].includes(extension)) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E5A92" stroke-width="2">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
    </svg>`;
  } else if (['xls', 'xlsx'].includes(extension)) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E5A92" stroke-width="2">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
    </svg>`;
  }
  
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E5A92" stroke-width="2">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
  </svg>`;
}

async function uploadMaterial() {
  if (!selectedFile) {
    alert('Please select a file');
    return;
  }

  const uploadBtn = document.getElementById('uploadButton');
  const uploadBtnText = document.getElementById('uploadBtnText');
  
  // Show loading state
  uploadBtn.disabled = true;
  uploadBtnText.innerHTML = '<span class="loading"></span> Uploading...';

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name);
    formData.append('programId', programId);

    const response = await fetch(`/files/session/${sessionId}/materials/create`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.redirectTo) {
      alert('Training material uploaded successfully!');
      // Redirect back to materials list
      window.location.href = `/admin/program/${programId}/course/${courseId}/session/${sessionId}/materials`;
    } else {
      alert('Upload failed. Please try again.');
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed. Please try again.');
  } finally {
    // Reset button state
    uploadBtn.disabled = false;
    uploadBtnText.textContent = 'Upload Material';
  }
}
