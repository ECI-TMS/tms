function fetchData(){
   const id = window.location.pathname.split("/")[3]
    const url = `/student/feedback/data/${id}`;
    fetch(url)
 .then(response => response.json())
 .then(feedback => {
    const data = feedback.feedback
let inputContainer = document.createElement("div")
let inputs = "";




data?.Inputs?.forEach(input => {

    if(input.Value === "stars") {
        let starsInput = `
<div class="col-md-6" id='inputContainer'>
<label for="validationCustom04" class="form-label">${input.Name}</label>
<select
  class="form-select input"
  name="${input.Name}"
>
  <option selected disabled value="">Choose...</option>
  <option value="1">1</option>
  <option value="2">2</option>
  <option value="3">3</option>
  <option value="4">4</option>
  <option value="5">5</option>
</select>
<div class="invalid-feedback">
  Please select a valid Organization.
</div>
</div>
`
        inputs = inputs.concat(starsInput)
    } else {
        let textInput = `
        <div class="col-md-6" id='inputContainer'>
        <label for="validationCustom04" class="form-label">${input.Name}</label>
        <input
          type="text"
          class="form-control input"
          name="${input.Name}"
          required
          />
        </div>
        `
        inputs =  inputs.concat(textInput)
    }
});
console.log(inputs)
inputContainer.innerHTML = inputs

document.querySelector(".inputContainerBox").append(inputContainer)

 })


}

window.addEventListener("DOMContentLoaded", fetchData)



function submitFeedback(e) {
    e.preventDefault();
  
    // Get all input fields with name "name" and "feedbackType"
    const inputsContainer = document.querySelectorAll('#inputContainer');
  
    // Create an array to store the data
    const dataObjects = [];
  
    // Iterate over each input field and create data objects
    inputsContainer.forEach(inputContainer => {
      let feedbackName;
      let feedbackValue = '';
      let singleInput = inputContainer.querySelector(".input")
        if (singleInput.type === 'select-one') {
            feedbackValue = singleInput.options[singleInput.selectedIndex].value;
            feedbackName = singleInput.name;
        } else {
            feedbackValue = singleInput.value
          feedbackName = singleInput.name;
        }
  
      // Create data object
      const dataObject = { inputName: feedbackName, inputValue: feedbackValue };
      dataObjects.push(dataObject);
    });
  
    console.log(dataObjects);
    // Send data to the backend (adjust the endpoint accordingly)
    fetch(`/student/feedback/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dataObjects),
    })
    .catch(error => {
        console.error("Error:", error);
    });
    window.location.href = "/student/feedbacks"
  }
  
  document.getElementById("feedbackForm").addEventListener("submit", submitFeedback);