import { Router } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import { join } from "path";

import prisma from "../lib/db.js";
import { formatDate } from "../lib/util.js";
const router = Router();

// Routes
router.get("/dashboard", (req, res) => {
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
        ProgramID: +userData.ProgramID,
        SubmitedReports: {
          none: {},
        },
      },
    });
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
    const sessions = await prisma.trainingsessions.findMany({
      where: {
        ProgramID: +userData.ProgramID,
      },
    });

    res.render("monitor/createReport", { report, sessions });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.post("/reports/:id/create", async (req, res) => {
  try {
    const { id } = req.params;
    const { SessionID } = req.body;
    const {file} = req.files;

    console.log("🚀 ~ router.post ~ SessionID:", file)

    const uploadsDirectory = join(process.cwd(), "public", "uploads");

    // Check if the report with the given ID exists
    const existingReport = await prisma.report.findUnique({
      where: { ReportID: +id },
    });

    if (!existingReport) {
      return res.status(404).json({ error: "Report not found" });
    }


  const sessionDirectory = join(uploadsDirectory, `${SessionID}`);

if (!fs.existsSync(uploadsDirectory)) {
      fs.mkdirSync(uploadsDirectory, { recursive: true });
    }

    // Create session directory if it doesn't exist
    if (!fs.existsSync(sessionDirectory)) {
      fs.mkdirSync(sessionDirectory, { recursive: true });
    }

    const FilePath = join(sessionDirectory, file.name);
      file.mv(FilePath);
      const path = FilePath.split(process.cwd())[1].replace("\\public", "");
    // Create and save the submitted report
    const submittedReport = await prisma.submitedReport.create({
      data: {
        ReportID: +existingReport.ReportID,
        SessionID: +SessionID,
        Value: path,
      },
    });

    res.redirect("/monitor/reports");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
