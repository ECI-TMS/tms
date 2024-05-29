const uploadButton = document.getElementById("uploadButton");
const fileInputs = document.querySelectorAll(".form-control");
const values = localStorage.getItem("user");
const user = JSON.parse(data);

if (!values) {
  window.location.href = "/";
}

function uploadFile(fileInput) {
  const files = [];
  console.log("fileInputs",fileInputs)
  fileInputs.forEach((item) => {
    if (item.files[0]) {
      const fileObject = {
        name: item.name, // assuming item is a file input element
        value: item.files[0],
      };
      files.push(fileObject);
    }
  });
  console.log("fileInputs",files)

  if (!!files.length) {
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${file.name}`;
      formData.append(fileName, file.value);
    }
    formData.append("ParticipantID", user.UserID);
    formData.append("SessionID", user.SessionID);

    fetch("/files/upload/documents", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        if (result.redirectTo) {
          location.href = "/student/dashboard";
        }
        // Handle success as needed
      })
      .catch((error) => {
        console.error("Error:", error);
        // Handle error as needed
      });
  } else {
    console.error("No files selected");
  }
}

uploadButton.addEventListener("click", () => {
  if (!!fileInputs.length) {
    uploadFile();
  }
});
