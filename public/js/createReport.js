const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const ProgramID = document.getElementById("ProgramID");
const titleInput = document.getElementById("titleInput");
const data = localStorage.getItem("user");
const user = JSON.parse(data);
if (!data) {
  window.location.href = "/";
}

function uploadFile(files) {
  const file = files[0];
  const title = titleInput.value

  if (file && title ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("Name", title);

    fetch(`/reports/${ProgramID.value}/create`, {
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
          location.href = `http://localhost:5000/admin/reports/${ProgramID.value}`
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
