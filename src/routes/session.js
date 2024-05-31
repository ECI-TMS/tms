import { Router } from "express";
import prisma from "../lib/db.js";

const router = Router();

router.post("/create", async (req, res) => {
  const {
    EndDate,
    StartDate,
    Center,
    TrainerID,
    MonitorID,
    CourseID,
    program_id

    
  } = req.body;
  

  try {


    if (
      !EndDate &&
      !StartDate &&
      !Center &&
      !TrainerID &&
      !MonitorID &&
      !CourseID
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }
    

    const existingSession = await prisma.trainingsessions.findFirst({
      where: {
        CourseID: +CourseID,
      },
    });
    
    
    
    

    const startDate = new Date(StartDate).toLocaleDateString();
    const endDate = new Date(EndDate).toLocaleDateString();
    const course = await prisma.course.findFirst({
      where: {
        CourseID: +CourseID,
      },
    });
    const data = await prisma.trainingsessions.create({
      data: {
        ProgramID: +program_id,
        EndDate: endDate,
        StartDate: startDate,
        Center,
        TrainerID: +TrainerID,
        MonitorID: +MonitorID,
        CourseID: +CourseID,
        DeliverablesStatus:'pending',
      },
    });
    
    if(existingSession){
      
      const  existingSessionId= existingSession.SessionID;
      const newSessionId =  data.SessionID;
      // assignments create after creating new session ================
      const assignments = await prisma.assignments.findMany({
        where: {
          SessionID:+existingSessionId,
          isUploadedByTrainer: true,
        },
      });
    
      for (const assignment of assignments) {
        console.log('Assignment:', assignment);
        await prisma.assignments.create({
          data: {
            SessionID: newSessionId,
            Title: assignment.Title,
            Deadline: assignment.Deadline,
            FilePath: assignment.FilePath,
            ParticipantID: assignment.ParticipantID,
            isUploadedByTrainer: assignment.isUploadedByTrainer,
            Grade: assignment.Grade,
            createdAt: assignment.createdAt,
          },
        });
      }
      // quizes create after creating new session=============
      const quizes = await prisma.quiz.findMany({
        where: {
          SessionID: +existingSessionId,
        },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });
      const transformedData = quizes.map(quiz => ({
        ...quiz,
        SessionID: newSessionId, // Change the SessionID to the new value
        questions: quiz.questions.map(question => ({
          ...question,
          quizId: undefined, // Remove the quizId to avoid conflicts during insertion
          options: question.options.map(option => ({
            ...option,
            questionId: undefined, // Remove the questionId to avoid conflicts during insertion
          })),
        })),
      }));
      for (const quiz of transformedData) {
        const createdQuiz = await prisma.quiz.create({
          data: {
            name: quiz.name,
            SessionID: quiz.SessionID,
            questions: {
              create: quiz.questions.map(question => ({
                question: question.question,
                answer: question.answer,
                options: {
                  create: question.options.map(option => ({
                    value: option.value,
                  })),
                },
              })),
            },
          },
        });
      
        console.log(`Created quiz with ID: ${createdQuiz.id}`);
      }
      // materials create after creating new session=============
      const materials = await prisma.materials.findMany({
        where: {
          SessionID: +existingSessionId,
        },
      });
      // Step 2: Modify the records to set the new SessionID and remove MaterialID
      const newMaterials = materials.map(({ MaterialID, createdAt, ...material }) => ({
        ...material,
        SessionID: newSessionId,
        
      }));
      
      // Step 3: Insert the modified records back into the materials table
      await prisma.materials.createMany({
        data: newMaterials,
      });


    }
    
    
    // console.log(`=========================`)
    // console.log(data);
    // console.log(`=========================`)

    res.redirect(`/admin/programs/${program_id}/courses/${CourseID}`);
  } catch (error) {
    res.status(400).json({ error });
  }
});






router.patch("/update/:id", async (req, res) => {
  const {
    ProgramID,
    EndDate,
    StartDate,
    Center,
    TrainerID,
    MonitorID,
    Course,
    DeliverablesStatus,
  } = req.body;

  try {
    if (
      !ProgramID &&
      !EndDate &&
      !StartDate &&
      !Center &&
      !TrainerID &&
      !MonitorID &&
      !Course
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const startDate = new Date(StartDate).toLocaleDateString();
    const endDate = new Date(EndDate).toLocaleDateString();

    const data = await prisma.trainingsessions.update({
      where: {
        SessionID: +req.params.id,
      },
      data: {
        ProgramID: +ProgramID,
        EndDate: endDate,
        StartDate: startDate,
        Center,
        TrainerID: +TrainerID,
        MonitorID: +MonitorID,
        Course,
        DeliverablesStatus,
      },
    });

    res.redirect("/admin/sessions");
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const data = await prisma.sessions.findUnique({
      where: {
        SessionID: req.params.id,
      },
    });

    if (!data) return res.status(400).json({ message: "something went wrong" });

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default router;
