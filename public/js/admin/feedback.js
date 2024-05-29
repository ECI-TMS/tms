function addInput() {
  var container = document.getElementById("inputContainer");
  var newDiv = document.createElement("div");
  newDiv.className = "col-12 mt-2 pt-2 border-top";
  newDiv.id = "singleInput"

  newDiv.innerHTML = `
      <label for="name">Feedback Name:</label>
      <input type="text" id="input" name="name" required>

      <label for="feedbackType">Feedback Type:</label>
      <select  id="input" name="feedbackType" required>
          <option value="stars">Stars</option>
          <option value="text">Text</option>
      </select>
  `;

  container.appendChild(newDiv);
}

function submitFeedback(e) {
  e.preventDefault();

  // Get all input fields with name "name" and "feedbackType"
  const inputsContainer = document.querySelectorAll('#singleInput');

  // Create an array to store the data
  const dataObjects = [];

  // Iterate over each input field and create data objects
  inputsContainer.forEach(inputContainer => {
    let feedbackName;
    let feedbackType = '';
    inputContainer.querySelectorAll("#input").forEach(input => {
      console.log("input.value ",input.type )
      if (input.type === 'select-one') {
        feedbackType = input.options[input.selectedIndex].value;
      } else {
        feedbackName = input.value;
      }
    });

    // Create data object
    const dataObject = { inputName: feedbackName, inputType: feedbackType };
    dataObjects.push(dataObject);
  });

  console.log(dataObjects);
const programID = document.getElementById("programID")
  // Send data to the backend (adjust the endpoint accordingly)
  fetch(`/admin/feedback/${programID.value}/create`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(dataObjects),
  })
  .then(response => response.json())
  .then(data => {
      console.log("Server response:", data);
  })
  .catch(error => {
      console.error("Error:", error);
  });
}

document.getElementById("feedbackForm").addEventListener("submit", submitFeedback);











// function addInput() {
//   // Get the container element
//   var container = document.getElementById("inputContainer");

//   // Create a new div element with the spe4ified structure
//   var newDiv = document.createElement("div");
//   newDiv.className = "col-12 mt-2";

//   newDiv.innerHTML = `
//   <label for="name">Feedback Name:</label>
// <input type="text" id="name" name="name" required>

// <label for="feedbackType">Feedback Type:</label>
// <select id="feedbackType" name="feedbackType" required>
//     <option value="stars">Stars</option>
//     <option value="text">Text</option>
// </select>
//     `;

//   // Append the new div to the container
//   container.appendChild(newDiv);
// }

// function submitFeedback(e) {
//   // Collect data from all input fields
//   e.preventDefault();

//   // Get form data
//   const formData = new FormData(e.target);
//   const feedbackName = formData.get("name");
//   const feedbackType = formData.get("feedbackType");

//   // Create data object
//   const dataObject = { inputName: feedbackName, inputType: feedbackType };
//   console.log(dataObject)
//   // Send data to backend
//   fetch("/your-backend-endpoint", {
//       method: "POST",
//       headers: {
//           "Content-Type": "application/json",
//       },
//       body: JSON.stringify(dataObject),
//   })
//   .then(response => response.json())
//   .then(data => {
//       // Handle response from the server if needed
//       console.log("Server response:", data);
//   })
//   .catch(error => {
//       // Handle errors
//       console.error("Error:", error);
//   });
// };


// document.getElementById("feedbackForm").addEventListener("submit", submitFeedback)