const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const sessionInput = document.getElementById("sessionInput");
const data = localStorage.getItem("user");
const user = JSON.parse(data);
if (!data) {
  window.location.href = "/";
}

function uploadFile(files) {
  const file = files[0];

  if (file) {
    const formData = new FormData();
    formData.append("file", file);

    fetch(`/files/session/${sessionInput.value}/materials/create`, {
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
        if (data.redirectTo) {
          location.reload();
        }
        // Handle success as needed
      })
      .catch((error) => {
        console.error("Error:", error);
        // Handle error as needed
      });
  } else {
    console.error("No file selected");
  }
}

uploadButton.addEventListener("click", () => {
  if (fileInput.files) {
    uploadFile(fileInput.files);
  }
});
