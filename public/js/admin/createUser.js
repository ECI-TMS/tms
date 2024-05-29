const uploadButton = document.getElementById("uploadButton");
const inputs = document.querySelectorAll(".input");
const fileInput = document.querySelector(".fileInput");

function createUser() {
  const formData = new FormData();

  for (let i = 0; i < inputs.length; i++) {
    let input = inputs[i];
    if (input.name) {
      formData.append(input.name, input.value);
    }
  }
  const file = fileInput.files[0];
  console.log("🚀 ~ createUser ~ file:");
  console.log("🚀 ~ createUser ~ file:", file);
  formData.append("ProfilePicture", file);

  fetch("/user/create", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log("🚀 ~ .then ~ data:", data)
      if (!!data.success) {
          for (let i = 0; i < inputs.length; i++) {
            inputs[i].value = ""
          }
      }
      alert(data.message);
      
      // Handle success as needed
    })
    .catch((error) => {
      console.error("Error:", error);
      // Handle error as needed
    });
}
