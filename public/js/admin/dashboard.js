// const data = localStorage.getItem("user");
// if (data) {
//   let userData = JSON.parse(data);
//   let userType = userData.UserType;
//   console.log("🚀 ~ file: dashboard.js:5 ~ userType:", userType);

//   if (userType !== " ADMIN") {
//     window.location.href = "/";
//   }
// }
const button = document
  .getElementById("logout")
  .addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  });

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("active");
}

// Create pie chart for program overview
fetch("/admin/dashboard/data")
  .then((res) => res.json())
  .then((data) => {
    let programOverviewTrainers = data.trainers.length;
    let programOverviewStudents = data.students.length;
    let programOverviewSessions = data.sessions.length;

    let categories = [];
    let counts = [];

    data.programs.forEach((element) => {
      categories.push(Object.keys(element)[0]);
      counts.push(Object.values(element)[0]);
    });

    // program overview
    const gendersOverviewData = {
      labels: ["Trainers", "Students", "Sessions"],
      datasets: [
        {
          data: [
            programOverviewTrainers,
            programOverviewStudents,
            programOverviewSessions,
          ],
          backgroundColor: [
            "rgba(75, 192, 192, 0.5)",
            "rgba(255, 99, 132, 0.5)",
            "rgba(255, 205, 86, 0.5)",
          ],
          hoverOffset: 4,
        },
      ],
    };

    const gendersOverviewCtx = document
      .getElementById("gendersChart")
      .getContext("2d");
    const gendersOverviewChart = new Chart(gendersOverviewCtx, {
      type: "pie",
      data: gendersOverviewData,
    });
    // program overview
    const programOverviewData = {
      labels: ["Trainers", "Students", "Sessions"],
      datasets: [
        {
          data: [
            programOverviewTrainers,
            programOverviewStudents,
            programOverviewSessions,
          ],
          backgroundColor: [
            "rgba(75, 192, 192, 0.5)",
            "rgba(255, 99, 132, 0.5)",
            "rgba(255, 205, 86, 0.5)",
          ],
          hoverOffset: 4,
        },
      ],
    };

    const programOverviewCtx = document
      .getElementById("programOverviewChart")
      .getContext("2d");
    const programOverviewChart = new Chart(programOverviewCtx, {
      type: "pie",
      data: programOverviewData,
    });

    // thematic area graph
    const thematicAreaData = {
      labels: categories,
      datasets: [
        {
          data: counts,
          backgroundColor: [
            "rgba(75, 192, 192, 0.5)",
            "rgba(255, 99, 132, 0.5)",
            "rgba(255, 205, 86, 0.5)",
          ],
          hoverOffset: 4,
        },
      ],
    };
    const trainersCtx = document
      .getElementById("trainersChart")
      .getContext("2d");
    const trainersChart = new Chart(trainersCtx, {
      type: "pie",
      data: thematicAreaData,
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  });

let selectedData;

function updateCharts(option) {
  switch (option) {
    case "program":
      selectedData = programWiseData;
      break;
    case "area":
      selectedData = areaWiseData;
      break;
    case "gender":
      selectedData = genderWiseData;
      break;
    default:
      break;
  }
}

// Function to handle radio button change
function handleRadioChange() {
  const radioButtons = document.getElementsByName("chartOption");
  let selectedOption;
  for (const radioButton of radioButtons) {
    if (radioButton.checked) {
      selectedOption = radioButton.value;
      break;
    }
  }

  // Update charts based on the selected option
  updateCharts(selectedOption);
}

// Add event listener to radio buttons
const radioButtons = document.getElementsByName("chartOption");
for (const radioButton of radioButtons) {
  radioButton.addEventListener("change", handleRadioChange);
}

// Initial load: Update charts with default option
updateCharts("area");
