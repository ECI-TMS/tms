const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("template");
const programSelect = document.getElementById("SessionID");
const titleInput = document.getElementById("name");
const trainerCheck = document.getElementById("trainer_check");
const monitorCheck = document.getElementById("monitor_check");
const data = localStorage.getItem("user");
const user = JSON.parse(data);

if (!data) {
  window.location.href = "/";
}

function uploadFile(files) {
  
  const file = files[0];
  
  const title = titleInput.value;
  const selectedOption = programSelect.options[programSelect.selectedIndex];
  const programIDValue = selectedOption.getAttribute('data-program-id');
  const sessionIDValue = programSelect.value;
  const isTrainer = document.getElementById("flexRadioCheckedDisabled").checked;
  const isMonitor = document.getElementById("flexRadioDisabled").checked;

  if (file && title && programIDValue && sessionIDValue) {
    const formData = new FormData();
    formData.append("template", file);
    formData.append("name", title);
    formData.append("ProgramID", programIDValue);
    formData.append("SessionID", sessionIDValue);
    formData.append("isTrainer", isTrainer);
    formData.append("isMonitor", isMonitor);

    if (isTrainer) {
      trainerCheck.value = true;
      monitorCheck.value = false;
    } else if (isMonitor) {
      trainerCheck.value = false;
      monitorCheck.value = true;
    }

    

    fetch("/admin/reports/add-report", {
      method: "POST",
      body: formData,
    })
     .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        alert("Report Submitted Successfully!");
        location.reload()
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

uploadButton.addEventListener("click", (event) => {
  event.preventDefault();
  if (fileInput.files) {
    uploadFile(fileInput.files);
  }
});
