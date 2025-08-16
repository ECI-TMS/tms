document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('organizationForm');
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    if (!data.Name) {
      alert('Name is required');
      return;
    }
    
    // Submit form via AJAX
    fetch(form.action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
      if (result.status) {
        alert(result.message);
        window.location.href = '/admin/organizations';
      } else {
        alert(result.message || 'Failed to update organization');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred while updating the organization');
    });
  });
});
