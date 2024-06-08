

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("active");
}


const data = localStorage.getItem("user");
if (data) {
  let userData = JSON.parse(data);
  let userType = userData.UserType;

  if (userType !== "TRAINER") {
    window.location.href = "/";
  }
}


const assignmentsData = {
  labels: [
    "Daily assignments",
    "Linkedin Accounts",
    "Pretests",
    "daily reports",
  ],
  datasets: [
    {
      label: "Completed",
      data: [12, 19, 3, 5],
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      borderColor: "rgba(75, 192, 192, 1)",
      borderWidth: 1,
    },
    {
      label: "Not Completed",
      data: [2, 29, 5, 5],
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      borderColor: "rgba(255, 99, 132, 1)",
      borderWidth: 1,
    },
  ],
};

const activitiesData = [
  {
    activity: "Daily Report",
    dueDate: "2023-03-21",
    action: "Shared",
  },
  {
    activity: "Video Review",
    dueDate: "2023-03-22",
    action: "Pending",
  },
];

const ctx = document.getElementById("assignmentsChart").getContext("2d");
new Chart(ctx, {
  type: "bar",
  data: assignmentsData,
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

const tbody = document.querySelector("#activitiesTable tbody");
activitiesData.forEach((activity) => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
        <td>${activity.activity}</td>
        <td>${activity.dueDate}</td>
        <td>${activity.action}</td>
    `;
  tbody.appendChild(tr);
});
