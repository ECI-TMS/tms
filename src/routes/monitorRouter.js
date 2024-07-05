import { Router } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import { join } from "path";
import path from 'path';
import { fileURLToPath } from 'url';


import prisma from "../lib/db.js";
import { formatDate } from "../lib/util.js";
import authMiddleware from "../middlewares/authmiddleware.js";
const router = Router();

// Routes
router.get("/dashboard", authMiddleware, (req, res) => {
  res.render("monitor/dashboard");
});

router.get("/assignments", async (req, res) => {
  try {
    const data = await prisma.programs.findMany();
    const donors = await prisma.thirdparties.findMany();
    const documents = await prisma.assignments.findMany({
      where: {
        isUploadedByTrainer: false,
      },
    });

    const assignments = documents.map((item) => ({
      ...item,
      createdAt: formatDate(item.createdAt),
    }));

    if (!data && !donors)
      return res.status(400).json({ message: "something went wrong" });

    res.render("monitor/assignments", { programs: data, donors, assignments });
  } catch (error) {
    res.status(400).json({ error });
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

    res.render("monitor/profile", { user: userData, program });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.get("/sessions", async (req, res) => {
  const { token } = req.cookies;

  const userData = jwt.verify(token, process.env.JWT_SECRET);
  try {
    const data = await prisma.trainingsessions.findMany({
      where: {
        ProgramID: +userData.ProgramID,
      },
      include: {
        course: true,
        programs: true,
      },
    });

    if (!data) return res.redirect("/admin/dashboard");

    res.render("monitor/allSessions", {
      sessions: data,
    });
  } catch (error) {
    console.log("🚀 ~ file: adminRouter.js:56 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});

router.get("/sessions/:id", async (req, res) => {
  try {
    const id = req.params.id;
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

    if (!data) return res.redirect("/admin/sessions");

    res.render("monitor/singleSession", {
      session: data,
      participants,
      assignments,
      documents,
      quizes,
    });
  } catch (error) {
    console.log("🚀 ~ file: adminRouter.js:56 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});

router.get("/session/:id/participants", async (req, res) => {
  try {
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

    res.render("monitor/sessionParticipants", {
      participants,
      session,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/session/:id/assignments", async (req, res) => {
  try {
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

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +req.params.id,
      },
    });

    res.render("monitor/assignments", {
      assignments,
      session,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/reports", async (req, res) => {
  const { token } = req.cookies;

  try {
    const userData = jwt.verify(token, process.env.JWT_SECRET);
    const reports = await prisma.report.findMany({
      where: {
        isForMonitor: true,
        ProgramID: +userData.ProgramID,
        SubmitedReports: {
          none: {},
        },
      },
    });
    // res.json(reports)
    res.render("monitor/reports", { reports });
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

    // console.log(user)
    res.render("monitor/createReport", { report, user});
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
    res.redirect("/monitor/reports");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error });
  }
});

router.get("/deliverables", async (req, res) => {

  try {
    const deliverables = await prisma.deliverables.findMany();
    
    console.log(deliverables);
    res.render("monitor/deliverables", { deliverables });
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
    res.render("monitor/AddDeliverables", { user });
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
res.redirect("/monitor/deliverables");
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({ error });
}


  
});


export default router;
