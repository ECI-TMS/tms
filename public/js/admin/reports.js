// JavaScript code for Programs section (CRUD operations)

// Function to open the modal for adding/editing programs
function openAddProgramModal() {
  // Logic to open the modal
  // You can customize this function based on your modal implementation
}

// Function to close the modal
function closeProgramModal() {
  // Logic to close the modal
  // You can customize this function based on your modal implementation
}

// Function to fetch and display programs from the server (demo data)
function fetchAndDisplayPrograms() {
  // You can use AJAX or fetch to get program data from the server
  // For demo purposes, let's create some dummy data
  const dummyPrograms = [
    { id: 1, name: "Programs", Details: "View Programs Reports" },
    { id: 2, name: "Sessions", Details: "View sessions Reports" },
    { id: 3, name: "Daily", Details: "View Daily Reports" },
  ];

  // Display programs in the UI
  const programsContainer = document.querySelector(".programs-container");
  programsContainer.innerHTML = "";

  dummyPrograms.forEach((program) => {
    const programCard = document.createElement("div");
    programCard.classList.add("program-card");

    programCard.innerHTML = `
            <h3>${program.name}</h3>
            <p>${program.Details}</p>
            <!-- Add additional details if needed -->
        `;

    programsContainer.appendChild(programCard);
  });
}

// Call the function to fetch and display programs when the page loads
document.addEventListener("DOMContentLoaded", fetchAndDisplayPrograms);
