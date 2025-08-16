document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('centerForm');
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    if (!data.Name || !data.City || !data.FocalPerson || !data.SeatingCapacity || !data.haveComputerLab) {
      alert('All fields are required');
      return;
    }
    
    // Validate seating capacity is a positive number
    if (isNaN(data.SeatingCapacity) || data.SeatingCapacity <= 0) {
      alert('Seating Capacity must be a positive number');
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
        window.location.href = '/admin/centers';
      } else {
        alert(result.message || 'Failed to update center');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred while updating the center');
    });
  });
});
