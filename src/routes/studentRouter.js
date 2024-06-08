import { Router } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/db.js";
import authMiddleware from "../middlewares/authmiddleware.js";
const router = Router();

// Routes
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const { UserID } = req.user;

const assignmentsWithDetails = await prisma.assignments.findMany({
  where: {
    isUploadedByTrainer: true,
  },
  include: {
    student_assignments_cust: true, // Include related student_assignments_cust records
  },
});

// Process the results to filter student_assignments_cust based on UserID and transform the array to a single object
const assignments = assignmentsWithDetails.map(assignment => {
  const filteredStudentAssignments = assignment.student_assignments_cust.filter(
    studentAssignment => 
      studentAssignment.AssignmentID === assignment.AssignmentID &&
      studentAssignment.ParticipantID === UserID
  );

  return {
    ...assignment,
    student_assignments_cust: filteredStudentAssignments[0] || null // Convert array to a single object or null
  };
});


    res.render("student/dashboard", { assignments });
  } catch (error) {}
});

router.get("/documents", async (req, res) => {
  try {
    const {token} = req.cookies
    const userData = jwt.verify(token, process.env.JWT_SECRET);
    

    
    const programWithDocumentTypes = await prisma.programs.findUnique({
      where: { ProgramID: +userData.ProgramID },
      include: {
        Documents: {
          include: {
            documentType: true,
          },
        },
      },
    });
    
    // Extract document types from the result
    const documentTypes = programWithDocumentTypes?.Documents.map((doc) => doc.documentType) || [];
    
    
    res.render("student/documents", {documentTypes});
  } catch (error) {
    console.log("student documents error",error);
  }
});
router.get("/materials", async (req, res) => {
  try {
    const {token} = req.cookies
    const userData = jwt.verify(token, process.env.JWT_SECRET);
    

    const materials = await prisma.materials.findMany({
      where: { SessionID: +userData.SessionID },
    });
    
    res.render("student/materials", {materials});
  } catch (error) {
    console.log("student documents error",error);
  }
});

router.get("/profile", async (req, res) => {
  try {
    const { token } = req.cookies;

    const userData = jwt.verify(token, process.env.JWT_SECRET);
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +userData.ProgramID,
      },
    });

    res.render("student/profile", { user: userData, program });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.get("/feedbacks", async (req, res) => {
  try {
    const { token } = req.cookies;

    const userData = jwt.verify(token, process.env.JWT_SECRET);
    
    // ===================
    const userPrograms = await prisma.programUsers.findMany({
      where: {
        UserID: +userData.UserID,
      },
      include: {
        program: true,
        user: true,
      },
    });

    // Group by ProgramID and include full program info at the group level
    const groupedByProgramID = userPrograms.reduce((acc, curr) => {
      const { ProgramID } = curr.program;
      if (!acc[ProgramID]) {
        acc[ProgramID] = {
          program: curr.program,
          programs: [],
        };
      }
      acc[ProgramID].programs.push(curr);
      return acc;
    }, {});

    // Convert the grouped object into an array format
    const userProgramsArray = Object.keys(groupedByProgramID).map(key => ({
      ProgramID: key,
      program: groupedByProgramID[key].program,
      programs: groupedByProgramID[key].programs,
    }));
    
    
    res.render("student/feedbacks", { userPrograms:userProgramsArray });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.post("/feedback/create", async (req, res) => {
  try {
    let {token } = req.cookies

    const userData = jwt.verify(token, process.env.JWT_SECRET);

    const inputs = req.body;
    

    const newFeedback = await prisma.Feedback.create({
      data: {
        CreatedByAdmin: false,
        ProgramID: userData.ProgramID,
      },
    });

    const feedbackInputs = inputs.map(async (input) => {
      return prisma.FeedbackInput.create({
        data: {
          Name: input.inputName,
          Value: input.inputValue,
          feedbackID: newFeedback.FeedbackID,
        },
      });
    });

    res.status(200)
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

// router.get("/feedback/data/:id", async (req, res) => {
//   try {
//     const id = req.params.id;
//     const feedback = await prisma.Feedback.findFirst({
//       where: {
//         FeedbackID: +id,
//       },
//       include: {
//         Inputs: true,
//       },
//     });
    
//     res.status(200).json({ feedback });
//   } catch (error) {
//     console.log("🚀 ~ router.get ~ error:", error);
//   }
// });
router.get("/feedback/program/:programId", async (req, res) => {
  try {
    const programId = +req.params.programId;

const feedbacks = await prisma.feedback.findMany({
  where: {
    ProgramID: programId,
  },
  include: {
    Inputs: true,
    users: true,
  },
});

const groupedBySessionID = feedbacks.reduce((acc, curr) => {
  const { SessionID, users } = curr;
  if (!acc[SessionID]) {
    acc[SessionID] = { SessionID, feedbacks: [], trainer: null, monitor: null };
  }
  acc[SessionID].feedbacks.push(curr);

  // Assign trainer or monitor at the group level
  if (users.UserType === 'TRAINER') {
    acc[SessionID].trainer = users;
    acc[SessionID].trainer.FeedbackID = curr.FeedbackID; // Assign FeedbackID to trainer
  } else if (users.UserType === 'MONITOR') {
    acc[SessionID].monitor = users;
    acc[SessionID].monitor.FeedbackID = curr.FeedbackID; // Assign FeedbackID to monitor
  }

  return acc;
}, {});

// Convert the grouped object into an array format
const feedbacksArray = Object.values(groupedBySessionID);

// Ensure Inputs array exists for trainer and monitor
feedbacksArray.forEach(session => {
  if (!session.trainer.Inputs) {
    session.trainer.Inputs = [];
  }
  if (!session.monitor.Inputs) {
    session.monitor.Inputs = [];
  }

  // Iterate through each feedback in the session
  session.feedbacks.forEach(feedback => {
    // Check if the feedback user is a trainer or monitor and add the inputs
    if (feedback.users.UserType === 'TRAINER') {
      session.trainer.Inputs.push(...feedback.Inputs);
    } else if (feedback.users.UserType === 'MONITOR') {
      session.monitor.Inputs.push(...feedback.Inputs);
    }
  });
});

// console.log(feedbacksArray);

    
    // console.log(JSON.stringify(feedbacksArray, null, 2));
    console.log(feedbacksArray);
    
    

    res.render("student/singleFeedback",{feedbacksArray,programId});
  } catch (error) {
    
  }
});

router.get("/upload", async (req, res) => {
  try {
    const trainerAssId  = req.query.ass_id;
    

    
    const data = await prisma.programs.findMany();
    const donors = await prisma.thirdparties.findMany();
    if (!data && !donors)
      return res.status(400).json({ message: "something went wrong" });

    res.render("student/upload", { programs: data, donors ,trainerAssId});
  } catch (error) {
    res.status(400).json({ error });
  }
});

// router.get("/quizes", async (req, res) => {
//   // const { token } = req.cookies;

//   // const userData = jwt.verify(token, process.env.JWT_SECRET);
//   try {
//     const quizes = await prisma.Quiz.findMany({
//       where: {
//         SessionID: +userData.SessionID,
//         SubmittedQuizes: {
//           none: {
//             UserID: +userData.UserID,
//           },
//         },
//       },
//       include: {
//         SubmittedQuizes: true,
//       },
//     });
//     res.json(quizes)
//     // res.render("student/quizes", {
//     //   quizes,
//     // });
//   } catch (error) {
//     console.log("🚀 ~ router.get ~ error:", error);
//     res.status(400).json({ error });
//   }
// });


//----------============================------------

router.get("/quizes", async (req, res) => {
  const { token } = req.cookies;
  try {
    const userData = jwt.verify(token, process.env.JWT_SECRET);
    const quizes = await prisma.Quiz.findMany({
      where: {
        SessionID: +userData.SessionID,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });


    // res.json(quizes)
    res.render("student/quizes", {
      quizes,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/quiz/:id", async (req, res) => {
  try {
    res.render("student/singleQuiz");
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/quiz/:id/data", async (req, res) => {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: +req.params.id,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
    res.status(200).json({ quiz });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("/quiz/:id/create", async (req, res) => {
  const { QuizID, QuizName, SessionID, score } = req.body.SubmissionData;
  
  const { token } = req.cookies;

  const userData = jwt.verify(token, process.env.JWT_SECRET);
  try {
    // Create Quiz
    const quiz = await prisma.SubmittedQuiz.create({
      data: {
        name: QuizName,
        score: +score,
        UserID: +userData.UserID,
        QuizID: +QuizID,
        SessionID: +SessionID,
      },
    });

    res.json({ redirectTo: "/student/quizes" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.post("/feedbacks/program/:programId/session/:session",authMiddleware,async (req,res)=>{
  const {trainer_id,trainer_feedback_response,trainer_feedbackid,monitor_id,monitor_feedback_response,monitor_feedbackid} = req.body;
  const {UserID} = req.user;
  if(trainer_feedback_response){
    const feedbackResponse = await prisma.feedbackResponse.create({
      data: {
        UserID: +UserID, // Replace with the actual UserID
        FeedbackID: +trainer_feedbackid, // Replace with the actual FeedbackID
        response: trainer_feedback_response,
      },
    });
    

  }



  if(monitor_feedback_response){
    const feedbackResponse = await prisma.feedbackResponse.create({
      data: {
        UserID: +UserID, // Replace with the actual UserID
        FeedbackID: +monitor_feedbackid, // Replace with the actual FeedbackID
        response: monitor_feedback_response,
      },
    });
    
    

  }
  res.redirect('/student/feedbacks');

})


router.get("/deliverables", async (req, res) => {

  try {
    const deliverables = await prisma.deliverables.findMany();
    
    console.log(deliverables);
    res.render("student/deliverables", { deliverables });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
})

export default router;
