document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('reportForm');
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    
    // Basic validation
    if (!formData.get('name')) {
      alert('Report name is required');
      return;
    }
    
    if (!formData.get('ProgramID')) {
      alert('Program ID is required');
      return;
    }
    
    if (!formData.get('SessionID')) {
      alert('Session ID is required');
      return;
    }
    
    // Check if a role is selected
    const targetRole = formData.get('targetRole');
    
    if (!targetRole) {
      alert('Please select a target role (Trainer or Monitor)');
      return;
    }
    
    // Check if file is required (only if no current file exists)
    const fileInput = document.getElementById('reportFile');
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
        window.location.href = '/admin/allReports';
      } else {
        alert(result.message || 'Failed to update report');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred while updating the report');
    });
  });
});
