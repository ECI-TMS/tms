$(document).ready(function() {
    // CNIC and Contact validation functions
    function validateCNIC(cnic) {
        // CNIC format: any 13 characters with dashes (e.g., 17301-0318537-3)
        // Pattern: 5 digits - 7 digits - 1 digit
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
        return cnicRegex.test(cnic);
    }

    function validateContact(contact) {
        // Contact format: 11 digits (any 11-digit number)
        const contactRegex = /^\d{11}$/;
        return contactRegex.test(contact);
    }

    // Add validation event listeners for both add and edit forms
    const cnicInput = document.getElementById('validationCustom02') || document.getElementById('cnic');
    const contactInput = document.getElementById('validationCustom04') || document.getElementById('contact');

    if (cnicInput) {
        let previousCnicValue = '';
        let isFormatting = false;
        
        // Function to update CNIC validation state
        function updateCnicValidation(cnic) {
            const isValid = validateCNIC(cnic);
            
            // Remove all validation classes first
            cnicInput.classList.remove('is-valid', 'is-invalid');
            
            // Hide all feedback messages
            const validFeedback = cnicInput.parentNode.querySelector('.valid-feedback');
            const invalidFeedback = cnicInput.parentNode.querySelector('.invalid-feedback');
            
            if (validFeedback) validFeedback.style.display = 'none';
            if (invalidFeedback) invalidFeedback.style.display = 'none';
            
            if (cnic.length > 0) {
                if (isValid) {
                    // Valid CNIC format - show green border and success message
                    cnicInput.classList.add('is-valid');
                    if (validFeedback) {
                        validFeedback.textContent = '✓ Format matched';
                        validFeedback.style.color = '#28a745';
                        validFeedback.style.display = 'block';
                    }
                    previousCnicValue = cnic;
                } else {
                    // Invalid format - show red border and error message
                    cnicInput.classList.add('is-invalid');
                    if (invalidFeedback) {
                        invalidFeedback.style.display = 'block';
                    }
                }
            }
        }
        
        // Handle input events
        cnicInput.addEventListener('input', function() {
            if (isFormatting) return; // Prevent recursive calls during formatting
            
            const cnic = this.value;
            
            // If CNIC was previously valid and now has more than 13 characters
            if (previousCnicValue && previousCnicValue.length === 13 && cnic.length > 13) {
                isFormatting = true;
                this.value = previousCnicValue;
                isFormatting = false;
                updateCnicValidation(previousCnicValue);
                return;
            }
            
            updateCnicValidation(cnic);
        });

        // Auto-format CNIC as user types (add dashes automatically)
        cnicInput.addEventListener('keyup', function(e) {
            if (isFormatting) return;
            
            // Skip formatting for navigation keys
            if ([8, 9, 13, 37, 38, 39, 40, 46].includes(e.keyCode)) return;
            
            isFormatting = true;
            let value = this.value.replace(/\D/g, ''); // Remove non-digits
            
            if (value.length <= 5) {
                this.value = value;
            } else if (value.length <= 12) {
                this.value = value.slice(0, 5) + '-' + value.slice(5);
            } else {
                this.value = value.slice(0, 5) + '-' + value.slice(5, 12) + '-' + value.slice(12, 13);
            }
            
            isFormatting = false;
            updateCnicValidation(this.value);
        });
        
        // Prevent typing when CNIC is already valid
        cnicInput.addEventListener('keydown', function(e) {
            const cnic = this.value;
            const isValid = validateCNIC(cnic);
            
            // If format is correct and user presses any key (except backspace, delete, tab, enter, arrow keys)
            if (isValid && cnic.length === 13 && ![8, 9, 13, 37, 38, 39, 40, 46].includes(e.keyCode)) {
                e.preventDefault();
                return false;
            }
        });
    }

    if (contactInput) {
        let previousContactValue = '';
        
        contactInput.addEventListener('input', function() {
            const contact = this.value;
            const isValid = validateContact(contact);
            
            if (contact.length > 0) {
                if (isValid) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                    // Update the feedback message
                    const feedbackElement = this.parentNode.querySelector('.valid-feedback');
                    if (feedbackElement) {
                        feedbackElement.textContent = '✓ Format matched';
                        feedbackElement.style.color = '#28a745';
                        feedbackElement.style.display = 'block';
                    }
                    // Store the valid value
                    previousContactValue = contact;
                } else {
                    this.classList.remove('is-valid');
                    this.classList.add('is-invalid');
                    // Hide valid feedback when invalid
                    const feedbackElement = this.parentNode.querySelector('.valid-feedback');
                    if (feedbackElement) {
                        feedbackElement.style.display = 'none';
                    }
                }
            } else {
                this.classList.remove('is-valid', 'is-invalid');
                // Hide feedback when empty
                const feedbackElement = this.parentNode.querySelector('.valid-feedback');
                if (feedbackElement) {
                    feedbackElement.style.display = 'none';
                }
            }
        });

        // Add keydown event to remove newly typed character when format is correct
        contactInput.addEventListener('keydown', function(e) {
            const contact = this.value;
            const isValid = validateContact(contact);
            
            // If format is correct and user presses any key (except backspace, delete, tab, enter)
            if (isValid && contact.length === 11 && ![8, 9, 13, 46].includes(e.keyCode)) {
                e.preventDefault();
                // Remove only the newly added character (restore to previous valid value)
                this.value = previousContactValue;
                // Trigger input event to update validation
                this.dispatchEvent(new Event('input'));
            }
        });

        // Auto-format contact as user types
        contactInput.addEventListener('keyup', function(e) {
            let value = this.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            this.value = value;
        });
    }

    // Form submission validation for both add and edit forms
    const participantForms = document.querySelectorAll('form[action="/participant/create"], form[action*="/participant/"]');
    participantForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const cnic = cnicInput ? cnicInput.value : '';
            const contact = contactInput ? contactInput.value : '';
            
            const isCnicValid = validateCNIC(cnic);
            const isContactValid = validateContact(contact);
            
            if (!isCnicValid) {
                e.preventDefault();
                alert('Please enter a valid CNIC in the format: 17301-0429538-3');
                cnicInput.focus();
                return false;
            }
            
            if (!isContactValid) {
                e.preventDefault();
                alert('Please enter a valid contact number (11 digits)');
                contactInput.focus();
                return false;
            }
        });
    });

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
  
      // Get the upload button and show loading state
      const uploadButton = document.getElementById('uploadButton');
      const uploadIcon = document.getElementById('uploadIcon');
      const uploadText = document.getElementById('uploadText');
      const uploadSpinner = document.getElementById('uploadSpinner');
  
      // Show loading state
      uploadButton.classList.add('loading');
      uploadButton.disabled = true;
  
      const formData = new FormData();
      formData.append('file', file);
  
      try {
        const response = await fetch('/admin/participant/bulk', {
          method: 'POST',
          body: formData
        });
  
        const result = await response.json();
  
        if (response.ok) {
          alert(result.message);
          $('#fileDialog').modal('hide');
          location.reload();
        } else {
          alert(result.error || 'Something went wrong.');
        }
      } catch (error) {
        alert('An error occurred during upload.');
      } finally {
        // Hide loading state
        uploadButton.classList.remove('loading');
        uploadButton.disabled = false;
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