$(document).ready(function() {
    $('#example').DataTable({
      responsive: true,
      pageLength: 10,
      order: [[0, 'desc']],
      language: {
        search: "Search participants:",
        lengthMenu: "Show _MENU_ participants per page",
        info: "Showing _START_ to _END_ of _TOTAL_ participants",
        paginate: {
          first: "First",
          last: "Last",
          next: "Next",
          previous: "Previous"
        }
      }
    });
  
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const fileDropZone = document.getElementById('file-drop-zone');
    const filePreview = document.getElementById('file-preview');
    const fileNameElement = document.getElementById('file-name');
    const fileSizeElement = document.getElementById('file-size');
    const removeFileBtn = document.getElementById('remove-file-btn');
  
    // Handle file selection
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) {
        fileNameElement.textContent = file.name;
        fileSizeElement.textContent = `${(file.size / 1024).toFixed(2)} KB`;
        fileDropZone.style.display = 'none';
        filePreview.style.display = 'flex'; // Use flex to align items
        filePreview.classList.add('file-preview-area');
      }
    });
  
    // Allow replacing the file by clicking the preview
    filePreview.addEventListener('click', (e) => {
      if (e.target.id !== 'remove-file-btn') {
        fileInput.click();
      }
    });
  
    // Handle file removal
    removeFileBtn.addEventListener('click', () => {
      fileInput.value = ''; // Clear the file input
      fileDropZone.style.display = 'block';
      filePreview.style.display = 'none';
      filePreview.classList.remove('file-preview-area');
    });
  
    // Handle form submission
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = fileInput.files[0];
  
      if (!file) {
        alert('Please select an Excel file to upload.');
        return;
      }
  
      const formData = new FormData();
      formData.append('file', file);
  
      try {
        const response = await fetch('/admin/participant/bulk', {
          method: 'POST',
          body: formData
        });
  
        const result = await response.json();
  
        if (response.ok) {
          alert('participant imported successfully');
          $('#fileDialog').modal('hide');
          location.reload();
        } else {
          alert(result.error || 'Something went wrong.');
        }
      } catch (error) {
        alert('An error occurred during upload.');
      }
    });
  });
  
  // Delete participant function
  async function deleteParticipant(participantId) {
    if (confirm('Are you sure you want to delete this participant? This action cannot be undone.')) {
      try {
        const response = await fetch(`/participant/deleteParticipant/${participantId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
  
        if (response.ok) {
          const row = document.querySelector(`tr[data-participant-id="${participantId}"]`);
          if (row) {
            row.style.transition = 'all 0.3s ease';
            row.style.transform = 'scale(0)';
            setTimeout(() => {
              row.remove();
            }, 300);
          }
        }
      } catch (error) {
        alert('An error occurred while deleting the participant.');
      }
    }
  }