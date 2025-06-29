let selectedFiles = [];

  // Initialize DataTable
  $(document).ready(function() {
    $('#fileTable').DataTable({
      responsive: true,
      pageLength: 10,
      lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
      order: [[0, 'asc']],
      language: {
        search: "Search files:",
        lengthMenu: "Show _MENU_ files per page",
        info: "Showing _START_ to _END_ of _TOTAL_ files",
        paginate: {
          first: "First",
          last: "Last",
          next: "Next",
          previous: "Previous"
        }
      },
      dom: '<"top"lf>rt<"bottom"ip><"clear">',
      columnDefs: [
        { orderable: false, targets: [1, 2] }
      ]
    });
  });

  // Modal functions
  function openUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    resetModal();
  }

  function resetModal() {
    selectedFiles = [];
    document.getElementById('modalFileInput').value = '';
    document.getElementById('fileList').style.display = 'none';
    document.getElementById('fileItems').innerHTML = '';
    document.getElementById('uploadBtn').disabled = true;
  }

  // File input handler
  document.getElementById('modalFileInput').addEventListener('change', function(e) {
    handleFiles(e.target.files);
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
    handleFiles(e.dataTransfer.files);
  });

  function handleFiles(files) {
  if (files.length > 0) {
    selectedFiles = [files[0]]; // Keep only the first selected file
    updateFileList();
  }
}

  function updateFileList() {
    const fileList = document.getElementById('fileList');
    const fileItems = document.getElementById('fileItems');
    const uploadBtn = document.getElementById('uploadBtn');

    if (selectedFiles.length > 0) {
      fileList.style.display = 'block';
      uploadBtn.disabled = false;
      
      fileItems.innerHTML = selectedFiles.map((file, index) => `
  <div class="file-item">
    <div class="file-info">
      <div class="file-icon">
        ${getFileIcon(file.name)}
      </div>
      <div>
        <div style="font-weight: 600; color: var(--primary-blue-dark);">
          ${file.name}
        </div>
        <div class="file-size">${formatFileSize(file.size)}</div>
      </div>
    </div>
    <button class="remove-file" onclick="removeFile(${index})" title="Remove file">
      ×
    </button>
  </div>
`).join('');

    } else {
      fileList.style.display = 'none';
      uploadBtn.disabled = true;
    }
  }

  function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function uploadFiles() {
  if (selectedFiles.length === 0) return;

  const table = $('#fileTable').DataTable();
  
  selectedFiles.forEach(file => {
    addFileToTable(file.name, table);
    alert(`Successfully uploaded: ${file.name}`);
  });

  closeUploadModal();
}

  
  // Add file to DataTable
  function addFileToTable(fileName, table) {
    const fileIcon = getFileIcon(fileName);
    
    const rowData = [
      `<div class="file-name">
        <div class="file-icon">${fileIcon}</div>
        ${fileName}
      </div>`,
      `<button class="action-icon download-icon" onclick="downloadFile('${fileName}')" title="Download">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>`,
      `<div class="actions-cell">
        <button class="action-icon delete-icon" onclick="deleteFile(this)" title="Delete">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19,6V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V6M8,6V4A2,2 0 0,1 10,2H14A2,2 0 0,1 16,4V6"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>`
    ];
    
    table.row.add(rowData).draw();
  }
  
  // Get appropriate file icon based on extension
  function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E5A92" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
      </svg>`;
    }
    
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E5A92" stroke-width="2">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
    </svg>`;
  }
  
  // Download file function
  function downloadFile(fileName) {
    // Simulate download
    console.log(`Downloading: ${fileName}`);
    // In real implementation: window.location.href = '/download/' + fileName;
  }
  
  // Delete file function
  function deleteFile(button) {
    if (confirm('Are you sure you want to delete this file?')) {
      const table = $('#fileTable').DataTable();
      const row = $(button).closest('tr');
      table.row(row).remove().draw();
    }
  }

  // Close modal when clicking outside
  document.getElementById('uploadModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeUploadModal();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('uploadModal').classList.contains('active')) {
      closeUploadModal();
    }
  });