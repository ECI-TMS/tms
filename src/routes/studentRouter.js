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

console.log(JSON.stringify(assignments, null, 2));
    res.render("student/dashboard", { assignments });
  } catch (error) {}
});

router.get("/documents", async (req, res) => {
  try {
    const {token} = req.cookies
    const userData = jwt.verify(token, process.env.JWT_SECRET);
    console.log("userData",userData);

    
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
    console.log("documentTypes",documentTypes);
    
    res.render("student/documents", {documentTypes});
  } catch (error) {
    console.log("student documents error",error);
  }
});
router.get("/materials", async (req, res) => {
  try {
    const {token} = req.cookies
    const userData = jwt.verify(token, process.env.JWT_SECRET);
    console.log("userData",userData);

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
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +userData.ProgramID
      }
    })
    const feedbacks = await prisma.Feedback.findMany({
      where: {
        CreatedByAdmin: true,
      },
      include: {
        Inputs: true,
      },
    });
    const feedbacksWithProgram = feedbacks.map(feedback => ({
      ...feedback,ProgramName: program.Name
    }));
    console.log("🚀 ~ router.get ~ feedbacks:", feedbacksWithProgram);
    res.render("student/feedbacks", { feedbacks:feedbacksWithProgram });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.post("/feedback/create", async (req, res) => {
  try {
    let {token } = req.cookies

    const userData = jwt.verify(token, process.env.JWT_SECRET);

    const inputs = req.body;
    console.log("🚀 ~ router.post ~ inputs:", inputs);

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

router.get("/feedback/data/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const feedback = await prisma.Feedback.findFirst({
      where: {
        FeedbackID: +id,
      },
      include: {
        Inputs: true,
      },
    });
    console.log("🚀 ~ router.get ~ feedback:", feedback);
    res.status(200).json({ feedback });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});
router.get("/feedback/:id", async (req, res) => {
  try {
    res.render("student/singleFeedback");
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
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
  try {
    const quizes = await prisma.Quiz.findMany({
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
  console.log(
    "🚀 ~ router.post ~ QuizID, QuizName, SessionID, score:",
    QuizID,
    QuizName,
    SessionID,
    score
  );
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

export default router;
