const loginForm = document.getElementById("loginForm");
const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");

const data = localStorage.getItem("user");

if (data) {
  let userData = JSON.parse(data);
  let userType = userData.UserType;

  if (userType === "ADMIN") {
    window.location.href = "/admin/dashboard";
  } else if (userType === "TRAINER") {
    window.location.href = "/trainer/dashboard";
  } else if (userType === "STUDENT") {
    window.location.href = "/student/dashboard";
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const Email = emailField.value;

  const Password = passwordField.value;

  const loginData = {
    Email,
    Password,
  };

  fetch("/login", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log("🚀 ~ .then ~ data:", data);
      const userType = data.userData.UserType;
      const user = JSON.stringify(data.userData);
      localStorage.setItem("user", user);

      if (userType === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else if (userType === "TRAINER") {
        window.location.href = "/trainer/dashboard";
      } else if (userType === "STUDENT") {
        window.location.href = "/student/dashboard";
      } else if (userType === "MONITOR") {
        window.location.href = "/monitor/dashboard";
      } else if (userType === "MANAGER") {
        window.location.href = "/manager/dashboard";
      }
    });
});
