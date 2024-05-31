const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("template");
const ProgramID = document.getElementById("ProgramID");
const SessionID = document.getElementById("SessionID");
const titleInput = document.getElementById("name");
const data = localStorage.getItem("user");
const user = JSON.parse(data);

if (!data) {
  window.location.href = "/";
}

function uploadFile(files) {
  const file = files[0];
  const title = titleInput.value;
  const ProgramIDValue = ProgramID.value;
  const SessionIDValue = SessionID.value;

  if (file && title && ProgramIDValue && SessionIDValue) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", title);
    formData.append("ProgramID", ProgramIDValue);
    formData.append("SessionID", SessionIDValue);

    console.log(formData);

    fetch("/admin/reports", {
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
          location.href = `http://localhost:5000/admin/reports/add-report`
      })
     .catch((error) => {
        console.error("Error:", error);
        // Handle error as needed
      });
  } else {
    console.error("Missing Fields");
    alert("Missing Fields")
  }
}

uploadButton.addEventListener("click", () => {
  if (fileInput.files) {
    uploadFile(fileInput.files);
  }
});