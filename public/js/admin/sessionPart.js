
$(document).ready(function() {
  $('#example').DataTable({
    responsive: true,
    pageLength: 10,
    order: [[0, 'asc']],
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
        // Remove the row from DataTable
        const table = $('#example').DataTable();
        const row = table.row(`tr[data-participant-id="${participantId}"]`);
        row.remove().draw();
        
        // Show success message
        showNotification('Participant deleted successfully!', 'success');
      } else {
        throw new Error('Failed to delete participant');
      }
    } catch (error) {
      console.error('Error deleting participant:', error);
      showNotification('Error deleting participant. Please try again.', 'error');
    }
  }
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
