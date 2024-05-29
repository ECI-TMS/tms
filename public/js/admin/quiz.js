const container = document.getElementById("inputContainer");
let questionNumber = 1;

function addInput() {
  if (!container) return;
  // Create a new div element with the spe4ified structure
  let newDiv = document.createElement("div");
  newDiv.className = "col-12 mt-2";
  newDiv.setAttribute("id", `question-${questionNumber}`);

  newDiv.innerHTML = `
        <hr/>
      <div class="col-12">
        <label for="question" class="form-label">Question</label>
        <input
          type="text"
          name="Question"
          class="form-control"
          id="question"
          required
        />
        <div class="valid-feedback">
          Looks good!
        </div>
      </div>
      <div class="col-12">
        <label for="answer" class="form-label">Answer</label>
        <input
          type="text"
          name="answer"
          class="form-control"
          id="answer"
          required
        />
        <div class="valid-feedback">
          Looks good!
        </div>
      </div>
      <label for="" class="form-label">Options</label>
      <div class="col-12 row">
        <div class="col-md-6">
          <input
            type="text"
            name="Question"
            class="form-control"
            id="question"
            required
          />
          <div class="valid-feedback">
            Looks good!
          </div>
        </div>
        <div class="col-md-6">
          <input
            type="text"
            name="Question"
            class="form-control"
            id="question"
            required
          />
          <div class="valid-feedback">
            Looks good!
          </div>
        </div>
      </div>
      <div class="col-12 row mt-4">
        <div class="col-md-6">
          <input
            type="text"
            name="Question"
            class="form-control"
            id="question"
            required
          />
          <div class="valid-feedback">
            Looks good!
          </div>
        </div>
        <div class="col-md-6">
          <input
            type="text"
            name="Question"
            class="form-control"
            id="question"
            required
          />
          <div class="valid-feedback">
            Looks good!
          </div>
        </div>
      </div>
    `;

  // Append the new div to the container
  container.appendChild(newDiv);
  questionNumber += 1;
}

function getData() {
  const nameInput = document.getElementById("name");
  const SessionID = document.getElementById("SessionID");

  const data = [];

  // Iterate through each question container
  for (let i = 1; i <= questionNumber; i++) {
    const questionContainer = document.getElementById(`question-${i}`);

    if (questionContainer) {
      const questionInput = questionContainer.querySelector("#question");
      const answerInput = questionContainer.querySelector("#answer");
      const optionsInputs =
        questionContainer.querySelectorAll(".col-md-6 input");

      // Extract data from inputs
      const question = questionInput ? questionInput.value : "";
      const answer = answerInput ? answerInput.value : "";
      const options = Array.from(optionsInputs).map((input) => input.value);

      // Build an object and push it to the data array
      data.push({
        question,
        answer,
        options,
      });
    }
  }

  let formdata = {
    quizData: data,
    name: nameInput.value,
    SessionID: SessionID.value,
  };

  fetch("/admin/quiz/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formdata),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      window.location.href = data.redirectTo;
    });
}
