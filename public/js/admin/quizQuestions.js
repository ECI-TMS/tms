// Quiz Questions Management JavaScript
let quizId = null;
let sessionId = null;
let questionsData = [];

// Initialize the quiz questions functionality
function initQuizQuestions(quizData, sessionData, questions) {
  quizId = quizData;
  sessionId = sessionData;
  questionsData = questions;
  
  console.log('Quiz Questions initialized:', { quizId, sessionId, questionsData });
}

// Modal functions
function showModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function hideModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  document.body.style.overflow = 'auto';
}

function closeUpdateModal() {
  hideModal('updateModal');
}

// Bulk update functions
function updateAllQuestions() {
  console.log('updateAllQuestions called');
  console.log('questionsData:', questionsData);
  
  if (!questionsData || questionsData.length === 0) {
    alert('No questions to update.');
    return;
  }
  
  populateQuestionsForm();
  showModal('updateModal');
}

function populateQuestionsForm() {
  const container = document.getElementById('questionsFormContainer');
  if (!container) {
    console.error('questionsFormContainer not found');
    return;
  }
  
  container.innerHTML = '';

  questionsData.forEach((question, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-form-section';
    
    // Safely escape HTML content
    const questionText = question.question ? question.question.replace(/"/g, '&quot;') : '';
    const answer = question.answer ? question.answer.replace(/"/g, '&quot;') : '';
    
    const option1 = question.options && question.options[0] ? question.options[0].value.replace(/"/g, '&quot;') : '';
    const option2 = question.options && question.options[1] ? question.options[1].value.replace(/"/g, '&quot;') : '';
    const option3 = question.options && question.options[2] ? question.options[2].value.replace(/"/g, '&quot;') : '';
    const option4 = question.options && question.options[3] ? question.options[3].value.replace(/"/g, '&quot;') : '';
    
    questionDiv.innerHTML = `
      <div class="question-header">
        <h3>Question ${index + 1}</h3>
      </div>
      <div class="form-group">
        <label class="form-label">Question Text</label>
        <textarea class="form-input question-text" rows="3" placeholder="Enter the question text">${questionText}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Options (Fixed 4 options)</label>
        <div class="options-grid">
          <div class="option-input-group">
            <input type="text" class="form-input option-input" placeholder="Option 1" value="${option1}">
          </div>
          <div class="option-input-group">
            <input type="text" class="form-input option-input" placeholder="Option 2" value="${option2}">
          </div>
          <div class="option-input-group">
            <input type="text" class="form-input option-input" placeholder="Option 3" value="${option3}">
          </div>
          <div class="option-input-group">
            <input type="text" class="form-input option-input" placeholder="Option 4" value="${option4}">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Correct Answer</label>
        <input type="text" class="form-input correct-answer" placeholder="Enter the correct answer" value="${answer}">
      </div>
      <input type="hidden" class="question-id" value="${question.id}">
      <hr class="question-divider">
    `;
    container.appendChild(questionDiv);
  });
}

function saveAllQuestions() {
  const questionSections = document.querySelectorAll('.question-form-section');
  const questionsToUpdate = [];

  questionSections.forEach((section, index) => {
    const questionId = section.querySelector('.question-id').value;
    const questionText = section.querySelector('.question-text').value.trim();
    const correctAnswer = section.querySelector('.correct-answer').value.trim();
    const optionInputs = section.querySelectorAll('.option-input');
    
    const options = Array.from(optionInputs).map(input => input.value.trim()).filter(value => value !== '');
    
    if (!questionText || !correctAnswer || options.length !== 4) {
      alert(`Please fill in all fields for Question ${index + 1}. Each question must have exactly 4 options.`);
      return;
    }

    questionsToUpdate.push({
      id: questionId,
      question: questionText,
      answer: correctAnswer,
      options: options
    });
  });

  if (questionsToUpdate.length === 0) return;

  // Show loading state
  const saveBtn = document.querySelector('#updateModal .btn-success');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<span class="loading"></span> Saving...';
  saveBtn.disabled = true;

  // Update all questions
  Promise.all(questionsToUpdate.map(questionData => 
    fetch(`/admin/quiz/question/${questionData.id}/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData),
    })
  ))
  .then(responses => Promise.all(responses.map(r => r.json())))
  .then(results => {
    const failedUpdates = results.filter(result => !result.success);
    
    if (failedUpdates.length === 0) {
      alert('All questions updated successfully!');
      closeUpdateModal();
      location.reload();
    } else {
      alert(`Error updating some questions. Please try again.`);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error updating questions. Please try again.');
  })
  .finally(() => {
    // Reset button state
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add event listener to the update button as backup
  const updateBtn = document.querySelector('.btn-success[onclick="updateAllQuestions()"]');
  if (updateBtn) {
    updateBtn.addEventListener('click', function(e) {
      console.log('Button clicked via event listener');
      updateAllQuestions();
    });
  }

  // Close modals when clicking outside
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(modal => {
        if (modal.style.display === 'flex') {
          modal.style.display = 'none';
          document.body.style.overflow = 'auto';
        }
      });
    }
  });
});

// Make functions globally available
window.updateAllQuestions = updateAllQuestions;
window.closeUpdateModal = closeUpdateModal;
window.saveAllQuestions = saveAllQuestions;
window.initQuizQuestions = initQuizQuestions;
