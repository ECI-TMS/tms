// Global variables for undo functionality
let deletedParticipantData = null;
let undoTimeout = null;
let undoInProgress = false;
let deletedRowElement = null;
let countdownInterval = null;

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

  // Add event listener for undo button
  document.getElementById('undoButton').addEventListener('click', handleUndo);
});

// Delete participant function with undo capability
async function deleteParticipant(participantId) {
  if (undoInProgress) {
    showNotification('Please wait for the current operation to complete.', 'warning');
    return;
  }

  if (confirm('Are you sure you want to delete this participant? You can undo this action within 45 seconds.')) {
    try {
      // Get the row data before deletion
      const table = $('#example').DataTable();
      const row = table.row(`tr[data-participant-id="${participantId}"]`);
      const rowData = row.data();
      const rowNode = row.node();

      // Store participant data for potential undo
      deletedParticipantData = {
        id: participantId,
        rowData: rowData,
        rowNode: rowNode,
        rowIndex: row.index()
      };

      const response = await fetch(`/participant/deleteParticipant/${participantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Instead of removing the row, replace the action buttons with undo button
        const actionCell = rowNode.querySelector('.action-buttons');
        const originalActions = actionCell.innerHTML;
        
        // Store the original actions for restoration
        deletedParticipantData.originalActions = originalActions;
        deletedRowElement = rowNode;
        
        // Replace with timer button
        actionCell.innerHTML = `
          <button class="action-btn undo-btn" onclick="handleUndo()" title="Undo Delete" style="background: linear-gradient(135deg, #28a745, #20c997); color: white; border: 1px solid #28a745; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3); display: flex; align-items: center; justify-content: center; width: 35px; height: 35px; font-weight: bold; font-size: 12px;">
            <span style="color: white; font-size: 12px;" id="timer-${participantId}">45</span>
            <div class="tooltip">Undo Delete</div>
          </button>
        `;
        
        // Add visual indication that row is deleted
        rowNode.style.opacity = '0.6';
        rowNode.style.backgroundColor = '#fff3cd';
        
        // Show undo notification
        showUndoNotification(`"${rowData[0].split('>')[1].split('<')[0].trim()}" deleted successfully!`);
        
        // Start timer countdown
        let timeLeft = 45;
        const timerElement = document.getElementById(`timer-${participantId}`);
        
        countdownInterval = setInterval(() => {
          timeLeft--;
          if (timerElement) {
            timerElement.textContent = timeLeft;
          }
          
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
          }
        }, 1000);

        // Set timeout for undo (45 seconds)
        undoTimeout = setTimeout(async () => {
          if (countdownInterval) {
            clearInterval(countdownInterval);
          }
          if (deletedParticipantData) {
            try {
              // Call backend to permanently delete the participant
              const permanentDeleteResponse = await fetch(`/participant/permanentlyDeleteParticipant/${participantId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                }
              });

              if (permanentDeleteResponse.ok) {
                // Permanently remove the row from the table
                const table = $('#example').DataTable();
                const currentRow = table.row(`tr[data-participant-id="${participantId}"]`);
                currentRow.remove().draw();
                
                hideUndoNotification();
                deletedParticipantData = null;
                deletedRowElement = null;
                showNotification('Undo time expired. Participant permanently deleted from database.', 'info');
              } else {
                console.error('Failed to permanently delete participant');
                showNotification('Error: Failed to permanently delete participant.', 'error');
              }
            } catch (error) {
              console.error('Error permanently deleting participant:', error);
              showNotification('Error: Failed to permanently delete participant.', 'error');
            }
          }
        }, 45000);

      } else {
        throw new Error('Failed to delete participant');
      }
    } catch (error) {
      console.error('Error deleting participant:', error);
      showNotification('Error deleting participant. Please try again.', 'error');
      deletedParticipantData = null;
    }
  }
}

// Handle undo action
async function handleUndo() {
  if (!deletedParticipantData || undoInProgress) {
    return;
  }

  undoInProgress = true;
  
  try {
    // Call backend to restore the participant
    const response = await fetch(`/participant/restoreParticipant/${deletedParticipantData.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      // Restore the original action buttons
      if (deletedRowElement && deletedParticipantData.originalActions) {
        const actionCell = deletedRowElement.querySelector('.action-buttons');
        actionCell.innerHTML = deletedParticipantData.originalActions;
        
        // Restore row appearance
        deletedRowElement.style.opacity = '1';
        deletedRowElement.style.backgroundColor = '';
      }
      
      // Hide undo notification
      hideUndoNotification();
      
      // Clear timeout and data
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        undoTimeout = null;
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      deletedParticipantData = null;
      deletedRowElement = null;
      
      showNotification('Participant restored successfully!', 'success');
    } else {
      throw new Error('Failed to restore participant');
    }
  } catch (error) {
    console.error('Error restoring participant:', error);
    showNotification('Error restoring participant. Please try again.', 'error');
  } finally {
    undoInProgress = false;
  }
}

// Show undo notification
function showUndoNotification(message) {
  const notification = document.getElementById('undoNotification');
  const messageElement = document.getElementById('undoMessage');
  
  messageElement.textContent = message;
  notification.style.display = 'block';
  
  // Reset progress bar animation
  const progressBar = notification.querySelector('.undo-progress-bar');
  progressBar.style.animation = 'none';
  progressBar.offsetHeight; // Trigger reflow
  progressBar.style.animation = 'progressShrink 45s linear';
}

// Hide undo notification
function hideUndoNotification() {
  const notification = document.getElementById('undoNotification');
  notification.classList.add('fade-out');
  
  setTimeout(() => {
    notification.style.display = 'none';
    notification.classList.remove('fade-out');
  }, 400);
}

// Show notification (enhanced version)
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const icon = getNotificationIcon(type);
  
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
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 350px;
    ${getNotificationStyle(type)}
  `;
  
  notification.innerHTML = `
    ${icon}
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Get notification icon based on type
function getNotificationIcon(type) {
  const icons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
  };
  return icons[type] || icons.info;
}

// Get notification style based on type
function getNotificationStyle(type) {
  const styles = {
    success: 'background: linear-gradient(135deg, #28a745, #20c997); box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);',
    error: 'background: linear-gradient(135deg, #dc3545, #e74c3c); box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);',
    warning: 'background: linear-gradient(135deg, #ffc107, #ffb74d); box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3); color: #212529;',
    info: 'background: linear-gradient(135deg, #17a2b8, #20c997); box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);'
  };
  return styles[type] || styles.info;
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
