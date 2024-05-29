const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const SessionID = document.getElementById("SessionID");
const report = document.getElementById("ReportID");
const data = localStorage.getItem("user");
const user = JSON.parse(data);
if (!data) {
  window.location.href = "/";
}

function uploadFile(files) {
  const file = files[0];
  const sessionId = SessionID.value

  if (file && sessionId ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("SessionID", sessionId);

    fetch(`/monitor/reports/${report.value}/create`, {
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
          location.href = `http://localhost:5000/monitor/reports/${SessionID.value}`
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
