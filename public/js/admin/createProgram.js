const form = document.getElementById("programForm");
const inputs = document.querySelectorAll("input");
const redirectUrl = new URLSearchParams(window.location.search).get("next");
console.log("🚀 ~ redirectUrl:", redirectUrl);
function onSubmit() {
  const formData = new FormData();

  for (let i = 0; i < inputs.length; i++) {
    let input = inputs[i];
    if (input.name) {
      formData.append(input.name, input.value);
    }
  }

  fetch("/admin/program/create", {
    method: "POST",
    body: formData,
  })
    .then((res) => {
      return res.json();
    })
    .catch((error) => {
      console.error("Error during fetch:", error);
    });
}
