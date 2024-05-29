import { Router } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/db.js";
import { formatDate } from "../lib/util.js";
const router = Router();

// Routes
router.get("/dashboard", async (req, res) => {
  try {
    const { token } = req.cookies;

    if (!token) res.redirect("/login");
    const { UserID } = jwt.decode(token);

    const sessions = await prisma.trainingsessions.findMany({
      where: {
        TrainerID: +UserID,
      },
      include: {
        course: true,
        programs: true,
      },
    });
    res.render("trainer/dashboard", { sessions ,layout:false});
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(400).json({
      message: "Something Went Wrong",
    });
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

    res.render("trainer/profile", { user: userData, program });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});
router.get("/:id/assignments", async (req, res) => {
  try {
    const  SessionID =  +req.params.id;
    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    const documents = await prisma.assignments.findMany({
      where: {
        SessionID: +req.params.id,
        isUploadedByTrainer: false,
      },
    });
    console.log("🚀 ~ router.get ~ documents:", documents);

    // const assignments = documents.map((item) => ({
    //   ...item,
    //   createdAt: formatDate(item.createdAt),
    // }));
    const assignmentsByStudents = await prisma.student_assignments_cust.findMany({
      include: {
        assignments: true,
      },
    });

    // const assignments = assignmentsByStudents.filter(
    //   (assignment) => assignment.assignments.SessionID === SessionID
      
      
    // );
    const assignments = assignmentsByStudents.filter((assignment) => assignment.assignments.SessionID === SessionID)
  .map((assignment) => ({
    ...assignment,
    createdAt: new Date(assignment.createdAt).toLocaleDateString('en-US'), // Formatting the createdAt field
  }));

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
    
  





    if (!session)
      return res.status(400).json({ message: "something went wrong" });

    res.render("trainer/assignments", { session, assignments ,modifiedAssByTrainerData,layout:false});
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post('/deleteUser',async(req,res)=>{

  try{
    const {id} = req.body
    const deletedUser = await prisma.users.delete({
     where: {
       UserID: +id
     },
   });

   // Respond with the deleted user's data
   res.json({
    status:true,
     message: 'User deleted successfully',
     user: deletedUser,
   });

    
  }catch(err){
    res.json({
      status:false,
       
     });

  }


})


router.post('/assignment/mark',async(req,res)=>{
  const {Grade,assignmentID,userID} =  req.body;
  console.log(Grade)
  console.log(assignmentID)
  console.log(userID)
  try {
    const updatedAssignment = await prisma.student_assignments_cust.updateMany({
      where: {
        AssignmentID: +assignmentID,
        ParticipantID: +userID
      },
      data: {
        Grade: +Grade
      }
    });
    res.json({ status: true });
  } catch (error) {
    res.json({status:false});
  }

})

export default router;
