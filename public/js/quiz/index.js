let data = [];
let SessionID;
let QuizID;
let QuizName;
let selectedOptions = [];
let currentQuestion = 0;
let score = 0;
let incorrectAnswers = [];

window.addEventListener("DOMContentLoaded", () => {
  const url = window.location.pathname;

  fetch(url + "/data")
   .then((res) => res.json())
   .then((resData) => {
      data = resData.quiz;

      SessionID = data.SessionID;
      QuizID = data.id;
      QuizName = data.name;

      if (data) main();
    });
});


const quizHeader = document.getElementById("quizName");
const quizContainer = document.getElementById("quiz");
const resultContainer = document.getElementById("result");
const submitButton = document.getElementById("submit");
const showAnswerButton = document.getElementById("showAnswer");
const previousButton = document.getElementById("previous");
const redirectButton = document.getElementById("redirect");

let shouldRedirect = false;

function main() {
  

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // quiz name dynamicaly show to every quiz
  const quizName = data.name;
  console.log(quizName);
  quizHeader.innerHTML = quizName;

  function displayQuestion() {
    const questionData = data.questions[currentQuestion];

    const questionElement = document.createElement("div");
    questionElement.className = "question";
    questionElement.innerHTML = `Q${currentQuestion + 1}. ${questionData.question}`;

    const optionsElement = document.createElement("div");
    optionsElement.className = "options";

    const shuffledOptions = [...questionData.options];
    shuffleArray(shuffledOptions);

    for (let i = 0; i < shuffledOptions.length; i++) {
      const option = document.createElement("label");
      option.className = "option";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "quiz";
      radio.value = shuffledOptions[i].value;
      radio.style.marginRight = "10px";

      const optionText = document.createTextNode(shuffledOptions[i].value);

      option.appendChild(radio);
      option.appendChild(optionText);
      optionsElement.appendChild(option);
    }

    quizContainer.innerHTML = "";
    quizContainer.appendChild(questionElement);
    quizContainer.appendChild(optionsElement);
  }

  function checkAnswer() {
    const selectedOption = document.querySelector('input[name="quiz"]:checked');
    if (selectedOption) {
      const answer = selectedOption.value;
      if (answer !== selectedOptions[currentQuestion]) {
        if (answer === data.questions[currentQuestion].answer) {
          if (selectedOptions[currentQuestion] === data.questions[currentQuestion].answer) {
            // The user had the correct answer before and still has it now, so don't update the score
          } else {
            score++; // The user had the correct answer before but changed it to an incorrect answer, so update the score
          }
        } else {
          if (selectedOptions[currentQuestion] === data.questions[currentQuestion].answer) {
            score--; // The user had the correct answer before but changed it to an incorrect answer, so decrease the score
          }
          incorrectAnswers.push({
            question: data.questions[currentQuestion].question,
            incorrectAnswer: answer,
            correctAnswer: data.questions[currentQuestion].answer,
          });
        }
        selectedOptions[currentQuestion] = answer; // store the selected option
      }
    }
  
    currentQuestion++;
    if (currentQuestion < data.questions.length) {
      displayQuestion();
      previousButton.classList.remove("hide");
      continueButton.classList.remove("hide");
    } else {
      displayResult();
      submitForm();
    }
  }


  function displayResult() {
    quizContainer.style.display = "none";
    submitButton.style.display = "none";
    showAnswerButton.style.display = "inline-block";
    resultContainer.innerHTML = `You scored ${score} out of ${data.questions.length}!`;
    redirectButton.style.display = "inline-block"; // show the redirect button
    previousButton.classList.add("hide");
  }

  function showAnswer() {
    quizContainer.style.display = "none";
    submitButton.style.display = "none";
    showAnswerButton.style.display = "none";
  
    // Filter out the previous occurrences of the same question
    const lastIncorrectAnswers = incorrectAnswers.filter((answer, index) => {
      return (
        index === incorrectAnswers.length - 1 ||
        answer.question!== incorrectAnswers[index + 1].question
      );
    });
  
    let incorrectAnswersHtml = "";
    for (let i = 0; i < lastIncorrectAnswers.length; i++) {
      incorrectAnswersHtml += `
      <p>
        <strong>Question:</strong> ${lastIncorrectAnswers[i].question}<br>
        <strong>Your Answer:</strong> ${lastIncorrectAnswers[i].incorrectAnswer}<br>
        <strong>Correct Answer:</strong> ${lastIncorrectAnswers[i].correctAnswer}
      </p>
    `;
    }
  
    resultContainer.innerHTML = `
      <p>You scored ${score} out of ${data.questions.length}!</p>
      <p>Incorrect Answers:</p>
      ${incorrectAnswersHtml}
    `;
  }

  function submitForm() {
    const url = window.location.pathname;

    let SubmissionData = {
      QuizID,
      QuizName,
      SessionID,
      score,
    };
    fetch(url + "/create", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ SubmissionData }),
    })
     .then((response) => response.json())
    //  .then((result) => {
    //     window.location.pathname = result.redirectTo;
    //   })
     .catch((error) => {
        alert("Error in submitting the form");
      });
  }


  
  function previousQuestion() {
    if (currentQuestion > 0) {
      currentQuestion--;
      displayQuestion();
      const storedOption = selectedOptions[currentQuestion];
      if (storedOption) {
        const optionElement = document.querySelector(`input[name="quiz"][value="${storedOption}"]`);
        optionElement.checked = true; // select the stored option
      }
    }
  }

  redirectButton.addEventListener("click", () => {
    shouldRedirect = true;
    // submitForm();
    if (shouldRedirect) {
      window.location.pathname = "/student/quizes";
    }
  });


previousButton.addEventListener("click", previousQuestion);
submitButton.addEventListener("click", checkAnswer);
showAnswerButton.addEventListener("click", showAnswer);


  displayQuestion();
}