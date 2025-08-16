document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('trainerForm');
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    if (!data.Email || !data.Username) {
      alert('Email and Username are required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.Email)) {
      alert('Please enter a valid email address');
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
        window.location.href = '/admin/trainers';
      } else {
        alert(result.message || 'Failed to update trainer');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred while updating the trainer');
    });
  });
});
