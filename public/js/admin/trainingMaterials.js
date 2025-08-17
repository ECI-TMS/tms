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

// Download material function
function downloadMaterial(filePath, fileName) {
  const link = document.createElement('a');
  link.href = filePath;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && document.getElementById('editModal').classList.contains('active')) {
    closeEditModal();
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
