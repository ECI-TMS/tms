import { Router } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/db.js";
import { formatDate } from "../lib/util.js";
import { fileURLToPath } from 'url';
import fs from "fs";
import path from 'path';
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

});



router.get("/reports", async (req, res) => {
  const { token } = req.cookies;

  try {
    const userData = jwt.verify(token, process.env.JWT_SECRET);
    const reports = await prisma.report.findMany({
      where: {
        isForTrainer: true,
        ProgramID: +userData.ProgramID,
        SubmitedReports: {
          none: {},
        },
      },
    });
    // res.json(reports)
    res.render("trainer/reports", { reports });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.get("/reports/:id/create", async (req, res) => {
  const { token } = req.cookies;

  try {
    const userData = jwt.verify(token, process.env.JWT_SECRET);

    const report = await prisma.report.findFirst({
      where: {
        ReportID: +req.params.id,
      },
    });
    const user = await prisma.users.findFirst({
      where:{
        UserID: userData.UserID
      }
    })

    // console.log(report, user)
    res.render("trainer/createReport", { report, user});
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.post("/reports/:id/create", async (req, res) => {
  const { ReportID, UserID } = req.body;
  const file = req.files ? req.files.template : null;


  if (!ReportID || !UserID || !file) {
    return res.status(400).json({ error: "Missing required fields or file" });
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Define the reports directory relative to the project root
  const baseDir = path.join(__dirname, '../../public');
  const reportsDir = path.join(baseDir, 'uploads', 'uploadReport');

  // Ensure the directory exists, if not, create it
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Define the file path
  const filePath = path.join(reportsDir, file.name);

  try {
    // Save the file to the directory
    await file.mv(filePath);

    // Get the relative file path and prepend a backslash
    let FilePath = path.relative(baseDir, filePath);
    FilePath = `\\${FilePath}`;

    // Insert data into the database
    await prisma.submitedReport.create({
      data: {
        ReportID: parseInt(ReportID),
        UserID: parseInt(UserID),
        FilePath: FilePath,
      }
    });

    // Redirect after successful file upload and database insertion
    res.redirect("/trainer/reports");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error });
  }
});


router.get("/deliverables", async (req, res) => {

  try {
    const deliverables = await prisma.deliverables.findMany();
    
    console.log(deliverables);
    res.render("trainer/deliverables", { deliverables });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
})


router.get("/deliverables/AddDeliverable", async (req, res) => {
  const { token } = req.cookies;
  try {
    const userData = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.users.findFirst({
      where:{
        UserID: userData.UserID
      }
    })
    res.render("trainer/AddDeliverables", { user });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.post("/deliverables/AddDeliverable", async (req, res) => {
  const { Title, UserID } = req.body;
  const file = req.files ? req.files.template : null;
  // console.log(file)
  const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
  console.log("form data: ", req.body)
try {
  if (!Title || !file) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Define the reports directory relative to the project root
  // const reportsDir = path.join(__dirname, '../../public/uploads/reports');
  const baseDir = path.join(__dirname, '../../public');
    const reportsDir = path.join(baseDir, '/uploads/deliverables');

  // Ensure the directory exists, if not, create it
  // fs.ensureDirSync(reportsDir);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Define the file path
  const filePath = path.join(reportsDir, file.name);

  // Save the file to the directory
  file.mv(filePath, (err) => {
    if (err) {
      console.error("Error saving file:", err);
      return res.status(500).json({ error: "Error saving file" });
    }
    // console.log("File saved to:", filePath);
    
    // Redirect after successful file upload
    // res.redirect("/admin/reports");
  });
  let FilePath = path.relative(baseDir, filePath);
  if (!FilePath.startsWith('\\')) {
    FilePath = `\\${FilePath}`;
  }
  // console.log(FilePath)
    try{
      const deliverables = await prisma.deliverables.create({
        data: {
          UserID: parseInt(UserID),
          Title: Title,
          FilePath: FilePath,
        }
      })

    }catch(err){
      console.log(err)
    }
res.redirect("/trainer/deliverables");
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({ error });
}


  
});


export default router;
