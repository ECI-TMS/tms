document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const inputs = document.querySelectorAll(".input");
  const fileInput = document.querySelector(".fileInput");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Stops default form submission (only if validation passed)

    const formData = new FormData();

    // Add text fields
    inputs.forEach((input) => {
      if (input.name) {
        formData.append(input.name, input.value);
      }
    });

    // Add profile picture (optional)
    if (fileInput.files.length > 0) {
      formData.append("ProfilePicture", fileInput.files[0]);
    }

    try {
      const res = await fetch("/user/create", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("🚀 ~ response data:", data);

      alert(data.message);

      if (res.ok && data.success) {
        // Reset form
        form.reset();

        


      }
    } catch (err) {
      console.error("Error:", err);
      alert("An error occurred. Please try again.");
    }
  });
});
