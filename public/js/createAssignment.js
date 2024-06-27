const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const sessionInput = document.getElementById("sessionInput");
const titleInput = document.getElementById("titleInput");
const deadlineInput = document.getElementById("deadlineInput");
const data = localStorage.getItem("user");
const user = JSON.parse(data);
if (!data) {
  window.location.href = "/";
}

function uploadFile(files) {
  const file = files[0];
  const title = titleInput.value
  const deadline = deadlineInput.value

  if (file && title && deadline) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("deadline", deadline);

    fetch(`/admin/${sessionInput.value}/assignment/create`, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
          location.reload();
      })
      .catch((error) => {
        console.error("Error:", error);
        // Handle error as needed
      });
  } else {
    console.error("No file selected");
    alert("Missing Fields")
  }
}

uploadButton.addEventListener("click", () => {
  if (fileInput.files) {
    uploadFile(fileInput.files);
  }
});




async function deleteAssignment(sessionID, assignmentID) {
  console.log('Delete button clicked for assignment:', assignmentID);
  try {
    const response = await fetch(`/admin/session/${sessionID}/assignments/${assignmentID}/delete`, {
      method: 'DELETE',
    });

    if (response.ok) {
      alert('Assignment deleted successfully!');
      location.reload(); // Reload the page to update the table
    } else {
      alert('Failed to delete assignment.');
    }
  } catch (error) {
    console.log('Error deleting assignment:', error);
    alert('Failed to delete assignment.');
  }
}

function confirmDelete(sessionID, assignmentID) {
  const confirmation = confirm('Do you want to delete the assignment?');
  if (confirmation) {
    deleteAssignment(sessionID, assignmentID);
  }
}