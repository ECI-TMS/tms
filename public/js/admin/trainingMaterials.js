let dataTable;
const sessionId = window.sessionData.sessionId;
const programId = window.sessionData.programId;
const courseId = window.sessionData.courseId;

// Initialize DataTable
$(document).ready(function() {
  dataTable = $('#materialsTable').DataTable({
    responsive: false,
    pageLength: 10,
    lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
    order: [[2, 'desc']], // Sort by upload date descending
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
      { orderable: false, targets: [3] }
    ],
    autoWidth: false,
    scrollX: false
  });
});

// Global variables for view modal
let currentViewingFile = null;
let currentViewingFileName = null;

// Download material function
function downloadMaterial(filePath, fileName) {
  const link = document.createElement('a');
  link.href = filePath;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// View material function
function viewMaterial(filePath, fileName) {
  currentViewingFile = filePath;
  currentViewingFileName = fileName;
  
  // Update modal title
  document.getElementById('viewModalTitle').textContent = `View: ${fileName}`;
  
  // Get file extension
  const fileExtension = fileName.split('.').pop().toLowerCase();
  const viewContent = document.getElementById('viewContent');
  
  // Clear previous content
  viewContent.innerHTML = '';
  
  // Show loading
  viewContent.innerHTML = '<div style="text-align: center;"><div class="loading"></div><p>Loading preview...</p></div>';
  
  // Show the view modal
  document.getElementById('viewModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Handle different file types
  if (['pdf'].includes(fileExtension)) {
    // PDF files
    viewContent.innerHTML = `
      <iframe src="${filePath}" 
              style="width: 100%; height: 100%; border: none;" 
              title="${fileName}">
      </iframe>
    `;
  } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
    // Image files
    viewContent.innerHTML = `
      <img src="${filePath}" 
           style="max-width: 100%; max-height: 100%; object-fit: contain;" 
           alt="${fileName}"
           onerror="handleViewError()">
    `;
  } else if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js'].includes(fileExtension)) {
    // Text files
    fetch(filePath)
      .then(response => response.text())
      .then(text => {
        viewContent.innerHTML = `
          <pre style="width: 100%; height: 100%; overflow: auto; margin: 0; padding: 1rem; 
                      background: #f8f9fa; border-radius: 8px; font-family: 'Courier New', monospace; 
                      font-size: 14px; line-height: 1.5;">${text}</pre>
        `;
      })
      .catch(error => {
        handleViewError();
      });
  } else {
    // Unsupported file types
    viewContent.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
        <h3 style="color: #6c757d; margin: 1rem 0;">Preview Not Available</h3>
        <p style="color: #6c757d;">This file type (${fileExtension.toUpperCase()}) cannot be previewed directly.</p>
        <p style="color: #6c757d;">Please download the file to view it.</p>
      </div>
    `;
  }
}

// Handle view errors
function handleViewError() {
  const viewContent = document.getElementById('viewContent');
  viewContent.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <h3 style="color: #dc3545; margin: 1rem 0;">Error Loading Preview</h3>
      <p style="color: #6c757d;">Unable to load the file preview.</p>
      <p style="color: #6c757d;">Please try downloading the file instead.</p>
    </div>
  `;
}

// Close view modal function
function closeViewModal() {
  document.getElementById('viewModal').classList.remove('active');
  document.body.style.overflow = 'auto';
  currentViewingFile = null;
  currentViewingFileName = null;
}

// Download from view modal
function downloadFromView() {
  if (currentViewingFile && currentViewingFileName) {
    downloadMaterial(currentViewingFile, currentViewingFileName);
  }
}

// Edit material function
function editMaterial(materialId, title, filePath) {
  // Store the material data for editing
  window.editingMaterial = {
    id: materialId,
    title: title,
    filePath: filePath
  };
  
  // Populate the edit modal
  document.getElementById('editCurrentFile').textContent = title;
  
  // Show the edit modal
  document.getElementById('editModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close edit modal function
function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
  document.body.style.overflow = 'auto';
  resetEditModal();
}

// Reset edit modal function
function resetEditModal() {
  window.editingMaterial = null;
  document.getElementById('editCurrentFile').textContent = '';
  document.getElementById('editFileInput').value = '';
  document.getElementById('updateBtn').disabled = false;
  document.getElementById('updateBtnText').textContent = 'Update Material';
}

// Handle edit file input
document.getElementById('editFileInput').addEventListener('change', function(e) {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    document.getElementById('editCurrentFile').textContent = file.name;
  }
});

// Update material function
async function updateMaterial() {
  if (!window.editingMaterial) return;

  const updateBtn = document.getElementById('updateBtn');
  const updateBtnText = document.getElementById('updateBtnText');
  
  // Determine the title - use new file's name if selected, otherwise keep current
  let title = window.editingMaterial.title;
  const fileInput = document.getElementById('editFileInput');
  if (fileInput.files.length > 0) {
    title = fileInput.files[0].name;
  }
  
  // Show loading state
  updateBtn.disabled = true;
  updateBtnText.innerHTML = '<span class="loading"></span> Updating...';

  try {
    const formData = new FormData();
    formData.append('title', title);
    
    // Add new file if selected
    if (fileInput.files.length > 0) {
      formData.append('file', fileInput.files[0]);
    }

    const response = await fetch(`/admin/materials/${window.editingMaterial.id}/edit`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      alert('Material updated successfully');
      closeEditModal();
      // Reload the page to show updated data
      window.location.reload();
    } else {
      alert(`Update failed: ${result.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Update error:', error);
    alert('Update failed. Please try again.');
  } finally {
    // Reset button state
    updateBtn.disabled = false;
    updateBtnText.textContent = 'Update Material';
  }
}

// Delete material function
async function deleteMaterial(materialId) {
  if (confirm('Are you sure you want to delete this training material? This action cannot be undone.')) {
    try {
      const response = await fetch(`/admin/materials/${materialId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('Material deleted successfully');
        // Reload the page to show updated data
        window.location.reload();
      } else {
        alert(`Delete failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed. Please try again.');
    }
  }
}

// Close modal when clicking outside
document.getElementById('editModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeEditModal();
  }
});

document.getElementById('viewModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeViewModal();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (document.getElementById('editModal').classList.contains('active')) {
      closeEditModal();
    }
    if (document.getElementById('viewModal').classList.contains('active')) {
      closeViewModal();
    }
  }
});

// Drag and drop functionality for edit modal
const editUploadArea = document.getElementById('editUploadArea');

editUploadArea.addEventListener('dragover', function(e) {
  e.preventDefault();
  editUploadArea.classList.add('dragover');
});

editUploadArea.addEventListener('dragleave', function(e) {
  e.preventDefault();
  editUploadArea.classList.remove('dragover');
});

editUploadArea.addEventListener('drop', function(e) {
  e.preventDefault();
  editUploadArea.classList.remove('dragover');
  
  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    document.getElementById('editFileInput').files = e.dataTransfer.files;
    document.getElementById('editCurrentFile').textContent = file.name;
  }
});
