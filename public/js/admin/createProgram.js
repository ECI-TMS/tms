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



  // fetch("/admin/program/create", {
  //   method: "POST",
  //   body: formData,
  // })
  //   .then((res) => {
  //     console.log(res)
      
  //   })
  //   .catch((error) => {
  //     console.error("Error during fetch:", error);
  //   });
  fetch("/admin/program/create", {
    method: "POST",
    body: formData,
  })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok && data.status) {
        alert(data.message || "Program created successfully!");
        form.reset(); // optional: clear form on success
      } else {
        alert(data.message || "Failed to create program. Please check your input.");
      }
    })
    .catch((error) => {
      alert("An unexpected error occurred. Please try again.");
      console.error("Fetch error:", error);
    });


}
