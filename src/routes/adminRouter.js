import { UserType } from "@prisma/client";
import { hash } from "bcrypt";
import { Router } from "express";
import prisma from "../lib/db.js";
import authMiddleware from "../middlewares/authmiddleware.js";
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();


// Routes
router.get("/dashboard/data", async (req, res) => {
  try {
    const students = await prisma.users.findMany({
      where: {
        UserType: UserType.STUDENT,
      },
    });
    const trainers = await prisma.users.findMany({
      where: {
        UserType: UserType.TRAINER,
      },
    });
    const sessions = await prisma.trainingsessions.findMany();
    const programCategories = await prisma.programs.groupBy({
      by: ["Category"],
      _count: {
        Category: true,
      },
    });

    const groupedData = programCategories.map((entry) => ({
      [entry.Category]: entry._count.Category,
    }));

    res
      .status(200)
      .json({ students, trainers, sessions, programs: groupedData });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.get("/dashboard", async (req, res) => {
  res.render("admin/dashboard");
});

router.get("/programs/data", async (req, res) => {
  try {
    const data = await prisma.programs.findMany();
    const donors = await prisma.thirdparties.findMany();
    if (!data && !donors)
      return res.status(400).json({ message: "something went wrong" });

    res.json({ programs: data, donors });
  } catch (error) {
    res.status(400).json({ error });
  }
});
router.get("/programs", async (req, res) => {

  
  
  try {
    const data = await prisma.programs.findMany({
      include: {
        thirdparty: true,
      },
    });
  
    
    const donors = await prisma.thirdparties.findMany();
    if (!data && !donors)
      return res.status(400).json({ message: "something went wrong" });

    res.render("admin/programs", { programs: data, donors });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/programs/:id", async (req, res) => {
  try {
    const sessions = await prisma.trainingsessions.count({
      where: {
        ProgramID: +req.params.id,
      },
    });

    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });
    const courses = await prisma.course.count({
      where: {
        ProgramID: +req.params.id,
      },
    });
    const trainers = await prisma.users.count({
      where: {
        UserType: UserType.TRAINER,
        ProgramID: req.params.id,
      },
    });
    const participants = await prisma.users.count({
      where: {
        UserType: UserType.STUDENT,
        ProgramID: req.params.id,
      },
    });

    res.render("admin/singleProgram", {
      sessions,
      courses,
      trainers,
      program,
      participants,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});
router.delete("/program/:id", async (req, res) => {
  try {
    console.log(+req.params.id)
    const program = await prisma.programs.delete({
      where: {
        ProgramID: +req.params.id,
      },
    });
    console.log(program)

    res.status(200).json({ message: "deleted succesfully" });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/programs/:id/sessions", async (req, res) => {
  try {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });
    const sessions = await prisma.trainingsessions.findMany({
      where: {
        ProgramID: +req.params.id,
      },
      include: {
        course: true,
        programs: true,
      },
    });

    res.render("admin/sessions", { sessions, program });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    console.log(
      "🚀 ~ file: adminRouter.js: url=/programs/:id/sessions ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.get("/organizations", async (req, res) => {
  try {
    const data = await prisma.thirdparties.findMany();

    if (!data) return res.status(400).json({ message: "something went wrong" });

    res.render("admin/organizations", { clients: data });
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=/organizations ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.get("/clients", async (req, res) => {
  try {
    const data = await prisma.client.findMany();

    if (!data) return res.status(400).json({ message: "something went wrong" });

    res.render("admin/clients", { clients: data });
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=clients ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.get("/organization/:id", async (req, res) => {
  try {
    

    const programCount = await prisma.programs.count({
      where: {
        DonorOrganizationID: +req.params.id,
      },
    });
    

    const clientsCount = await prisma.client.count({
      where: {
        ThirdPartyID: +req.params.id,
      },
    });
    

    const organization = await prisma.thirdparties.findFirst({
      where: {
        ThirdPartyID: +req.params.id,
      },
    });
    

    res.render("admin/singleOrganization", {
      programCount,
      clientsCount,
      organization,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/organization/:id/programs", async (req, res) => {
  try {
    const organization = await prisma.thirdparties.findFirst({
      where: {
        ThirdPartyID: +req.params.id,
      },
    });
    const programs = await prisma.programs.findMany({
      where: {
        DonorOrganizationID: +req.params.id,
      },
    });

    res.render("admin/organizationPrograms", {
      programs,
      organization,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/organization/:id/clients", async (req, res) => {
  try {
    const organization = await prisma.thirdparties.findFirst({
      where: {
        ThirdPartyID: +req.params.id,
      },
    });
    
    const clients = await prisma.client.findMany({
      where: {
        ThirdPartyID: +req.params.id,
      },
      include: {
        user: true,
        thirdparty: true,
      },
    });
    

    res.render("admin/organizationClients", {
      clients,
      organization,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/programs/:id/courses", async (req, res) => {
  try {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });
    const courses = await prisma.course.findMany({
      where: {
        ProgramID: +req.params.id,
      },
      include: {
        program: true,
        sessions: true,
      },
    });
    

    res.render("admin/programCourses", {
      courses,
      program,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});
router.get("/programs/:id/trainers", async (req, res) => {
  try {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });
    const trainers = await prisma.users.findMany({
      where: {
        UserType: UserType.TRAINER,
        ProgramID: req.params.id,
      },
    });
    

    res.render("admin/programTrainers", {
      trainers,
      program,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});
router.get("/programs/:id/participants", async (req, res) => {
  try {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });
    const trainers = await prisma.users.findMany({
      where: {
        UserType: UserType.STUDENT,
        ProgramID: req.params.id,
      },
    });
    

    res.render("admin/programParticipants", {
      trainers,
      program,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/programs/:programId/courses/:id", async (req, res) => {
  const programId =  req.params.programId;
  const courseId =   +req.params.id;
  

  try {
    const course = await prisma.course.findFirst({
      where: {
        CourseID: +req.params.id,
      },
    });

    const sessions = await prisma.trainingsessions.findMany({
      where: {
        CourseID: +req.params.id,
      },
      include: {
        course: true,
        programs: true,
      },
    });
    

    res.render("admin/singleCourse", {
      sessions,
      course,
      programId,
      courseId
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/clients/create", async (req, res) => {
  try {
    const organizations = await prisma.thirdparties.findMany();
    res.render("admin/createClient", { organizations });
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=/clients/create ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.post("/clients/create", async (req, res) => {
  const { Username, Password, Email, ThirdPartyID } = req.body;

  try {
    if (!Username && !Password && !Email && !ThirdPartyID) {
      return res.status(400).json({ error: "Missing fields" });
    }

    let hashedPassword = await hash(Password, 10);

    const newUser = await prisma.users.create({
      data: {
        Username,
        Password: hashedPassword,
        Email,
        UserType: UserType.CLIENT,
        client: {
          create: {
            ThirdPartyID: +ThirdPartyID,
          },
        },
      },
      include: {
        client: true,
      },
    });

    res.redirect("/admin/dashboard");
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/organizations/create", async (req, res) => {
  try {
    res.render("admin/createOrganization");
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=/organizations/create ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.get("/session/update/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +id,
      },
    });
    const programs = await prisma.programs.findMany();
    const centers = await prisma.centers.findMany();
    const users = await prisma.users.findMany();

    if (!data) return res.redirect("/admin/sessions");

    res.render("admin/updateSession", {
      session: data,
      programs,
      users,
      centers,
    });
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=/session/update/:id ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.get("/sessions", async (req, res) => {
  try {
    const data = await prisma.trainingsessions.findMany({
      include: {
        course: true,
        programs: true,
      },
    });

    if (!data) return res.redirect("/admin/dashboard");

    res.render("admin/allSessions", {
      sessions: data,
    });
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=/sessions ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.get("/program/:programId/course/:courseId/sessions/:id", async (req, res) => {
  try {
    const id = req.params.id;  // course id
    const programId = +req.params.programId;  // course id
    const courseId = +req.params.courseId;  // course id
    
    const data = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +id,
      },
    });

    const participants = await prisma.Participant.count({
      where: {
        sessionId: +id,
      },
    });

    const assignments = await prisma.assignments.count({
      where: {
        SessionID: +id,
      },
    });

    const documents = await prisma.documents.count({
      where: {
        SessionID: +id,
      },
    });
    const quizes = await prisma.Quiz.count({
      where: {
        SessionID: +id,
      },
    });
    const material = await prisma.materials.count({
      where: {
        SessionID: +id,
        ProgramID: programId,

      },
    });

    if (!data) return res.redirect("/admin/sessions");

    res.render("admin/singleSession", {
      session: data,
      participants,
      assignments,
      documents,
      quizes,
      material,
      programId,
      courseId
    });
  } catch (error) {
    console.log(
      "🚀 ~ file: adminRouter.js:url=/sessions/:id ~ router.get ~ error:",
      error
    );
    res.status(400).json({ error });
  }
});

router.get("/program/:programId/course/:courseId/session/:id/participants", async (req, res) => {
  try {
    const  sessionId  =  +req.params.id;
    const  programId  =  +req.params.programId;
    const  courseId  =  +req.params.courseId;
    const participants = await prisma.Participant.findMany({
      where: {
        sessionId: +req.params.id,
      },
    });
    

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    res.render(`admin/sessionParticipants`, {
      participants,
      session,
      sessionId,
      programId,
      courseId
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/session/:id/assignments", authMiddleware, async (req, res) => {
  
  try {
    const user =  req.user;
    
    const data = await prisma.assignments.findMany({
      where: {
        SessionID: +req.params.id,
        isUploadedByTrainer: false,
      },
      include: {
        trainingsessions: true,
      },
    });

    let assignments = [];
    for (let i = 0; i < data.length; i++) {
      const program = await prisma.programs.findFirst({
        where: {
          ProgramID: data[i].trainingsessions.ProgramID,
        },
      });
      assignments.push({ ...data[i], program: program.Name });
    }

    // ====================
    const SessionID =  +req.params.id;
    const assignmentsByStudentsRecord = await prisma.student_assignments_cust.findMany({
      include: {
        assignments: true,
      },
    });
    // const assignmentsByStudents = assignmentsByStudentsRecord.filter(
    //   (assignment) => assignment.assignments.SessionID === SessionID
    // );
    const assignmentsByStudents = assignmentsByStudentsRecord
  .filter((assignment) => assignment.assignments.SessionID === SessionID)
  .map((assignment) => ({
    ...assignment,
    createdAt: new Date(assignment.createdAt).toLocaleDateString('en-US'), // Formatting the createdAt field
  })
);
  
    
    
    



    // assignments by  trainer
    const assByTrainerData = await prisma.assignments.findMany({
      where: {
        SessionID: +req.params.id,
        isUploadedByTrainer: true,
      },
      include: {
        trainingsessions: {
          include: {
            users_trainingsessions_TrainerIDTousers: true, // Include the trainer user details
          },
        },
      },
      
    });
    const modifiedAssByTrainerData = assByTrainerData.map(assignment => ({
      ...assignment,
      trainer: assignment.trainingsessions.users_trainingsessions_TrainerIDTousers,
    }));
    
    

    



    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    res.render("admin/assignments", {
      assignmentsByStudents,
      session,
      modifiedAssByTrainerData,
      user
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/session/:id/documents", async (req, res) => {
  try {
    const documents = await prisma.documents.findMany({
      where: {
        SessionID: +req.params.id,
      },
    });

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    res.render("admin/sessionDocuments", {
      documents,
      session,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/program/:programId/course/:courseId/session/:id/materials", async (req, res) => {
  try {
    const materials = await prisma.materials.findMany({
      where: {
        SessionID: +req.params.id,
      },
    });

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    res.render("admin/trainingMaterial", {
      materials,
      session,
      programId:req.params.programId,
      courseId:req.params.courseId,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/program/:programId/course/:courseId/session/:id/materials/create", async (req, res) => {
  try {
    const programId =  +req.params.programId


 const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });
    res.render("admin/createMaterial", {
      sessionId:+req.params.id,
      programId
    });

  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/session/:id/quizes", async (req, res) => {
  try {
    const quizes = await prisma.Quiz.findMany({
      where: {
        SessionID: +req.params.id,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        SubmittedQuizes: true,
      },
    });

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    res.render("admin/quizes", {
      quizes,
      session,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});


// ===========================================================================
router.get("/session/:id/quizes/:quizId", async (req, res) => {
  try {
    const quizquestions = await prisma.Quiz.findFirst({
      where: {
        id: +req.params.quizId,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });
    // res.json(session)
    res.render("admin/quizQuestions", {
      questions: quizquestions.questions,
      session,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});



router.get("/documents", async (req, res) => {
  try {
    const documents = await prisma.documentType.findMany();

    res.render("admin/documents", {
      documents
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("/document/create", async (req, res) => {
  const {Name} = req.body

  try {
    const documentExist = await prisma.documentType.findFirst({
      where: {
        Name
      }
    });

    if (documentExist) {
      return res.status(400).json({
        message: `Document ${Name} already exists`
      })
    }

    const newDocument = await prisma.documentType.create({
      data: {
        Name
      }
    })
    res.redirect("/admin/documents");
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.delete("/document/:id", async (req, res) => {
  try {
    const document = await prisma.documentType.delete({
      where: {
        DocumentTypeID: +req.params.id,
      },
    });

    res.status(200).json({ message: "deleted succesfully" });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/quiz/:id", async (req, res) => {
  try {
    let SubmittedQuizes = [];
    const data = await prisma.Quiz.findUnique({
      where: { id: +req.params.id },
      include: {
        SubmittedQuizes: true,
      },
    });

    for (let i = 0; i < data.SubmittedQuizes.length; i++) {
      const user = await prisma.users.findUnique({
        where: {
          UserID: +data.SubmittedQuizes[i].UserID,
        },
      });
      SubmittedQuizes.push({ ...data.SubmittedQuizes[i], user });
    }
    
    
    res.render("admin/singleQuiz", {
      SubmittedQuizes,
    });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});



router.get("/quiz/:id/create", async (req, res) => {
  try {
    res.render("admin/createQuiz", { SessionID: req.params.id });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("/quiz/create", async (req, res) => {
  const { quizData, name, SessionID } = req.body;

  try {
    // Create Quiz
    const quiz = await prisma.Quiz.create({
      data: {
        name,
        SessionID: +SessionID,
        questions: {
          create: quizData.map((question) => ({
            question: question.question,
            answer: question.answer,
            options: {
              create: question.options.map((option) => ({
                value: option,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    res.json({ redirectTo: `/admin/session/${SessionID}/quizes` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/programs/:programId/courses/:id/session/create", async (req, res) => {

  
  try {

    

    const centers = await prisma.centers.findMany();
    const trainers = await prisma.users.findMany({
      where: {
        UserType: UserType.TRAINER,
      },
    });
    const monitors = await prisma.users.findMany({
      where: {
        UserType: UserType.MONITOR,
      },
    });
    const courses = await prisma.course.findMany();
    const course_id = req.params.id;
    const programId = req.params.programId;
    

    res.render("admin/createSession", { trainers, monitors, centers, courses ,course_id ,programId});
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/programss/:id/courses/create", async (req, res) => {
  console.log('calling')
  try {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });
    res.render("admin/createCourse", { program });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("/programs/:id/courses/create", async (req, res) => {
  try {
    const { Name } = req.body;
    const ProgramID = req.params.id;
    
    if (!Name && !ProgramID) {
      return res.status(400).json({ message: "Please Fillout all the fields" });
    }
    const data = await prisma.course.create({
      data: {
        Name,
        ProgramID: +ProgramID,
      },
    });

    res.redirect(`/admin/programs/${ProgramID}/courses`);
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/program/:programId/course/:courseId/session/:sessionId/participant", async (req, res) => {
  try {
     const sessionId =  +req.params.sessionId;
     const programId =  +req.params.programId;
     const courseId =  +req.params.courseId;
     const data = await prisma.Participant.findMany({
      where: {
        sessionId: sessionId
      }
    });

    const sessions = await prisma.trainingsessions.findMany();
    res.render("admin/participants", { participants: data, sessions,programId,courseId,sessionId });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/monitors", async (req, res) => {
  try {
    const monitors = await prisma.users.findMany({
      where: {
        UserType: UserType.MONITOR,
      },
    });

    res.render("admin/monitors", { monitors });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/centers", async (req, res) => {
  try {
    const data = await prisma.centers.findMany();
    let centers = [];

    for(let i = 0; i < data.length; i++) {
      let center = data[i]
      center.isPublicSector = center.isPublicSector ? "Yes": "No"
      center.haveComputerLab = center.haveComputerLab ? "Yes": "No"

      centers.push(center)
    }
    

    res.render("admin/centers", { centers });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/trainers", async (req, res) => {
  try {
    let trainers = await prisma.users.findMany({
      where: {
        UserType: UserType.TRAINER,
      },
    });

    let allTrainers = [];

    for (let i = 0; i < trainers.length; i++) {
      let trainer = trainers[i];
      let sessions = await prisma.trainingsessions.findMany({
        where: {
          TrainerID: +trainer.UserID,
        },
      });

      let programName;
      if (sessions.length) {
        let program = await prisma.trainingsessions.findFirst({
          where: {
            ProgramID: +sessions[0].ProgramID,
          },
        });
        programName = program.Name;
      }
      let count = sessions.length;
      let data = {
        ...trainer,
        sessionsCompleted: count,
        programName,
      };
      allTrainers.push(data);
    }

    res.render("admin/trainers", { trainers: allTrainers });
  } catch (error) {
    
  }
});

router.get("/assignments", async (req, res) => {
  try {
    let assignments = await prisma.assignments.findMany({
      where: {
        isUploadedByTrainer: false,
      },
      include: {
        trainingsessions: true,
        marks: true,
      },
    });

    res.render("admin/assignments", { assignments });
  } catch (error) {
    console.log("error admin assignments: ", error);
  }
});

router.get("/feedbacks", async (req, res) => {
  try {
    const programs = await prisma.programs.findMany({
      include: {
        thirdparty: true,
      },
    });
    res.render("admin/feedbacks", {programs});
  } catch (error) {
    console.log("error admin feedbacks: ", error);
    
  }
});

router.get("/feedbacks/program/:id", async (req, res) => {
  try {
    const id = req.params.id;

    

    const sessions = await prisma.trainingsessions.findMany({
      where: {
        ProgramID: +req.params.id,
        
      },
      include: {
        programs: true,
        users_trainingsessions_TrainerIDTousers: true,
        users_trainingsessions_MonitorIDTousers:true
      },
    });
    

    
    
    res.render("admin/programFeedback", { id ,sessions});
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});


router.post(`/feedbacks/program/:programId/session/:sessionId`,authMiddleware,async(req,res)=>{
  const programId = +req.params.programId;
  const sessionId = +req.params.sessionId;
  const adminId = +req.user.UserID
  
  if(req.body['trainer_options']){
    const UserID = +req.body['trainer_id'];
    // console.log('for trainer the feedback type is :'  ,req.body['trainer_options']) ;
    const feedbackInserted =  await prisma.feedback.create({
      data: {
        ProgramID: programId,
        SessionID: sessionId,
        UserID:UserID,
        CreatedByAdmin:true
        
      }
    });
     const feedbackId =  feedbackInserted.FeedbackID ;
     if(feedbackId){
      const feedbackInserted =  await prisma.feedback_type.create({
        data: {
          FeedbackID: +feedbackId,
          feedback_type: req.body['trainer_options'],
          
        }
      });


     }
    

  }
  if(req.body['monitor_options']){
    const UserID = +req.body['monitor_id'];
    // console.log('for trainer the feedback type is :'  ,req.body['trainer_options']) ;
    const feedbackInserted =  await prisma.feedback.create({
      data: {
        ProgramID: programId,
        SessionID: sessionId,
        UserID:UserID,
        CreatedByAdmin:true
        
      }
    });
     const feedbackId =  feedbackInserted.FeedbackID ;
     if(feedbackId){
      const feedbackInserted =  await prisma.feedback_type.create({
        data: {
          FeedbackID: +feedbackId,
          feedback_type: req.body['monitor_options'],
          
        }
      });


     }

  }
  res.redirect('/admin/feedbacks')
  
  

  

});



router.post("/feedback/:id/create", async (req, res) => {
  try {
    const body = req.body;
    

    const feedback = await prisma.feedback.create({
      data: {
        ProgramID: req.params.id, // replace with the actual program ID
        CreatedByAdmin: true, // replace with the actual value
      },
    });

    // Step 2: Create FeedbackInput entries for each item in the feedbackData array
    for (const input of body) {
      await prisma.feedbackInput.create({
        data: {
          Name: input.inputName,
          Value: input.inputType,
          feedbackID: feedback.FeedbackID, // associate with the created Feedback entry
        },
      });
    }
    // return res.redirect("/admin/feedbacks");
  } catch (error) {
    console.log("🚀 ~ router.post ~ error:", error);
  }
  res.render("admin/feedbacks");
});

router.get("/user/create", async (req, res) => {
  try {
    const programs = await prisma.programs.findMany();

    res.render("admin/createUser", { programs });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.get("/program/create", async (_, res) => {
  try {
    const donors = await prisma.thirdparties.findMany();

    const managers = await prisma.users.findMany({
      where: {
        UserType: UserType.MANAGER
      }
    });

    const documentType = await prisma.documentType.findMany()

    res.render("admin/createProgram", { donors, managers, documentType });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.post("/program/create", async (req, res) => {
  const { Name, StartDate, EndDate, DonorOrganization, Description, Category,documentTypes } =
    req.body;

    
  try {
    if (
      !Name ||
      !EndDate ||
      !StartDate ||
      !DonorOrganization ||
      !Description ||
      !Category
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const startDate = new Date(StartDate).toLocaleDateString();
    const endDate = new Date(EndDate).toLocaleDateString();

    const data = await prisma.programs.create({
      data: {
        Name,
        EndDate: endDate,
        Startdate: startDate,
        DonorOrganizationID: +DonorOrganization,
        Description,
        Category,
        Documents: {
          create: documentTypes.map((documentTypeId) => ({
            documentType: { connect: { DocumentTypeID: +documentTypeId } },
          })),
        },
      },
    });

    if (!data) return res.status(400).json({ error: "Missing fields" });
    res.redirect("/admin/programs");
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.post("/center/create", async (req, res) => {
  const {
    Name,
    City,
    FocalPerson,
    SeatingCapacity,
    haveComputerLab,
  } = req.body;

  try {
    if (
      !Name ||
      !City ||
      !FocalPerson ||
      !SeatingCapacity ||
      !haveComputerLab
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const data = await prisma.centers.create({
      data: {
        Name,
        City,
        FocalPerson,
        SeatingCapacity: +SeatingCapacity,
        haveComputerLab: Boolean(haveComputerLab),
      },
    });

    
    
    if (!data) return res.status(400).json({ error: "Missing fields" });
    res.redirect("/admin/centers");
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get("/reports", async (req, res) => {
  try {
    const programs = await prisma.programs.findMany({
      include: {
        trainingsessions: true,
      },
    });
    const sessions = await prisma.trainingsessions.findMany({
      include: {
        sessionId: req.params.SessionID
      },
    });
    console.log(programs)
    // res.json(programs);
    res.render("admin/reports", { programs, sessions });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

// ======================================================
// Handle the POST request to /add-report
router.post("/reports/add-report", async (req, res) => {
  const { name, ProgramID, SessionID,isTrainer,isMonitor } = req.body;
  const file = req.files ? req.files.template : null;
  console.log(file)
  const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
  

  
  
  
try {
  if (!name || !ProgramID || !SessionID || !file) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Define the reports directory relative to the project root
  const reportsDir = path.join(__dirname, '../../public/uploads/reports');

  // Ensure the directory exists, if not, create it
  fs.ensureDirSync(reportsDir);

  // Define the file path
  const filePath = path.join(reportsDir, file.name);

  // Save the file to the directory
  file.mv(filePath, (err) => {
    if (err) {
      console.error("Error saving file:", err);
      return res.status(500).json({ error: "Error saving file" });
    }

    console.log("File saved to:", filePath);

    // Redirect after successful file upload
    res.redirect("/admin/reports");
  });

} catch (error) {
  console.error("Error:", error);
  res.status(500).json({ error });
}
});







// all reports of a program
router.get("/reports/:id", async (req, res) => {
  try {
    const id = +req.params.id; // Convert to number

    // Use `findFirst` to find a single record
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: id,
      },
    });

    

    if (!program) {
      throw new Error(`Program with ID ${id} not found`);
    }

    const reports = await prisma.report.findMany({
      where: {
        ProgramID: +id,
      },
      include: {
        SubmitedReports: true,
      },
    });

    res.render("admin/programReports", { program, reports });
  } catch (error) {
    console.error("🚀 ~ router.get ~ error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// single report
router.get("/report/:id", async (req, res) => {
  try {
    const id = +req.params.id; // Convert to number
    const report = await prisma.submitedReport.findMany({
      where: {
        ReportID: +id,
      },
      include: {
        report: true,
      },
    });

    const mainReport = await prisma.report.findFirst({
      where: {
        ReportID: +id,
      },
    });
    

    if (!report) {
      throw new Error(`Program with ID ${id} not found`);
    }

    res.render("admin/singleReport", {
      report,
      mainReport,
    });
  } catch (error) {
    console.error("🚀 ~ router.get ~ error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/reports/:id/create", async (req, res) => {
  try {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +req.params.id,
      },
    });

    // res.json(program);
    res.render("admin/createReport", { program });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

export default router;
