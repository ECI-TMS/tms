$(document).ready(function() {
    // Initialize DataTable
    $('#backupsTable').DataTable({
        responsive: true,
        pageLength: 10,
        order: [[0, 'asc']],
        language: {
            search: "Search backups:",
            lengthMenu: "Show _MENU_ backups per page",
            info: "Showing _START_ to _END_ of _TOTAL_ backups",
            paginate: {
                first: "First",
                last: "Last",
                next: "Next",
                previous: "Previous"
            }
        }
    });

    // Handle backup generation form submission
    $('#generateBackupForm').on('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = $('#generateSubmitBtn');
        const btnText = $('#generateBtnText');
        const btnSpinner = $('#generateBtnSpinner');
        const generateBtn = $('#generateBtn');
        
        // Disable button and show loading
        submitBtn.prop('disabled', true);
        generateBtn.prop('disabled', true);
        btnText.text('Generating...');
        btnSpinner.show();

        const formData = new FormData(this);

        try {
            const response = await fetch('/admin/backups/generate', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Show success message
                showNotification('Backup generated successfully!', 'success');
                
                // Close modal
                $('#generateBackupModal').modal('hide');
                
                // Reset form
                this.reset();
                
                // Reload page to show new backup
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                showNotification(result.error || 'Failed to generate backup', 'error');
            }
        } catch (error) {
            console.error('Error generating backup:', error);
            showNotification('An error occurred while generating backup', 'error');
        } finally {
            // Re-enable button and hide loading
            submitBtn.prop('disabled', false);
            generateBtn.prop('disabled', false);
            btnText.text('Generate Backup');
            btnSpinner.hide();
        }
    });

    // Reset form when modal is closed
    $('#generateBackupModal').on('hidden.bs.modal', function() {
        $('#generateBackupForm')[0].reset();
        const submitBtn = $('#generateSubmitBtn');
        const btnText = $('#generateBtnText');
        const btnSpinner = $('#generateBtnSpinner');
        const generateBtn = $('#generateBtn');
        
        submitBtn.prop('disabled', false);
        generateBtn.prop('disabled', false);
        btnText.text('Generate Backup');
        btnSpinner.hide();
    });
});

// Download backup function
async function downloadBackup(backupId) {
    try {
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = `/admin/backups/${backupId}/download`;
        link.download = '';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Download started...', 'success');
    } catch (error) {
        console.error('Error downloading backup:', error);
        showNotification('Failed to download backup', 'error');
    }
}

// Delete backup function
async function deleteBackup(backupId) {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/admin/backups/${backupId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Remove row from table with animation
            const row = document.querySelector(`tr[data-backup-id="${backupId}"]`);
            if (row) {
                row.style.transition = 'all 0.3s ease';
                row.style.transform = 'scale(0)';
                row.style.opacity = '0';
                
                setTimeout(() => {
                    row.remove();
                    // Refresh DataTable
                    $('#backupsTable').DataTable().draw();
                }, 300);
            }
            
            showNotification('Backup deleted successfully', 'success');
        } else {
            showNotification(result.error || 'Failed to delete backup', 'error');
        }
    } catch (error) {
        console.error('Error deleting backup:', error);
        showNotification('An error occurred while deleting backup', 'error');
    }
}

// Notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border: none;
        border-radius: 8px;
    `;
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Format file size helper function
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date helper function
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
