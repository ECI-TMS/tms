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
