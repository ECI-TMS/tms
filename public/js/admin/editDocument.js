document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('documentForm');
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    
    // Basic validation
    if (!formData.get('Name')) {
      alert('Document name is required');
      return;
    }
    
    // Check if file is required (only if no current file exists)
    const fileInput = document.getElementById('documentFile');
    const hasCurrentFile = document.querySelector('.current-file') !== null;
    
    if (!hasCurrentFile && !fileInput.files[0]) {
      alert('Please select a file to upload');
      return;
    }
    
    // Submit form via AJAX
    fetch(form.action, {
      method: 'POST',
      body: formData // Use FormData for file uploads
    })
    .then(response => response.json())
    .then(result => {
      if (result.status) {
        alert(result.message);
        window.location.href = '/admin/documents';
      } else {
        alert(result.message || 'Failed to update document');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred while updating the document');
    });
  });
});
