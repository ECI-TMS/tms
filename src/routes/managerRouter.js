import { UserType } from "@prisma/client";
import excelToJson from "convert-excel-to-json";
import { Router } from "express";
import { join } from "path";

import prisma from "../lib/db.js";
import { formatDate } from "../lib/util.js";

const router = Router();

// Routes
router.get("/dashboard", (req, res) => {
  res.render("manager/dashboard");
});

router.get("/programs/:id", async (req, res) => {
  try {
    const data = await prisma.trainingsessions.findMany({
      where: {
        ProgramID: +req.params.id,
      },
    });

    const donors = await prisma.thirdparties.findMany();

    let sessions = [];

    for (let i = 0; i < data.length; i++) {
      let value = data[i].EndDate - data[i].StartDate;
      let days = Math.floor(value / (1000 * 60 * 60 * 24));

      let EndDate = formatDate(data[i].EndDate);
      let StartDate = formatDate(data[i].StartDate);

      let trainer = await prisma.users.findFirst({
        where: {
          UserID: data[i].TrainerID,
        },
      });

      let monitor = await prisma.users.findFirst({
        where: {
          UserID: data[i].MonitorID,
        },
      });
      let program = await prisma.programs.findFirst({
        where: {
          ProgramID: data[i].ProgramID,
        },
      });

      const session = {
        ...data[i],
        EndDate,
        StartDate,
        program: program.Name,
        Duration: days,
        trainer: trainer.Username,
        monitor: monitor.Username,
      };
      sessions.push(session);
    }

    res.render("manager/singleProgram", { sessions, donors });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.trainingsessions.findMany({
      where: {
        ProgramID: +id,
      },
    });
    const centers = await prisma.centers.findMany();
    const users = await prisma.users.findMany();

    if (!data) return res.status(400).json({ message: "something went wrong" });

    let sessions = [];

    for (let i = 0; i < data.length; i++) {
      let value = new Date(data[i].EndDate) - new Date(data[i].StartDate);

      let days = Math.floor(value / (1000 * 60 * 60 * 24));

      let EndDate = formatDate(data[i].EndDate);
      let StartDate = formatDate(data[i].StartDate);

      let trainer = await prisma.users.findFirst({
        where: {
          UserID: data[i].TrainerID,
        },
      });

      let monitor = await prisma.users.findFirst({
        where: {
          UserID: data[i].MonitorID,
        },
      });
      let program = await prisma.programs.findFirst({
        where: {
          ProgramID: data[i].ProgramID,
        },
      });

      const session = {
        ...data[i],
        EndDate,
        StartDate,
        program: program.Name,
        Duration: days,
        trainer: trainer.Username,
        monitor: monitor.Username,
      };
      sessions.push(session);
    }

    res.status(200).json({
      sessions,
    });
  } catch (error) {
    console.log("🚀 ~ file: managerRouter.js:56 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});

router.post("/session/create", async (req, res) => {
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

    const data = await prisma.trainingsessions.create({
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

    res.redirect("/manager/sessions");
  } catch (error) {
    res.status(400).json({ error });
  }
});
router.get("/sessions", async (_, res) => {
  try {
    const centers = await prisma.centers.findMany();
    const users = await prisma.users.findMany();
    res.render("manager/sessions", { centers, users });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.get("/clients", async (req, res) => {
  try {
    const data = await prisma.thirdparties.findMany();

    if (!data) return res.status(400).json({ message: "something went wrong" });

    res.render("manager/clients", { clients: data });
  } catch (error) {
    console.log("🚀 ~ file: managerRouter.js:56 ~ router.get ~ error:", error);
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

    if (!data) return res.redirect("/manager/sessions");

    res.render("manager/updateSession", {
      session: data,
      programs,
      users,
      centers,
    });
  } catch (error) {
    console.log("🚀 ~ file: managerRouter.js:56 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});

router.get("/session/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +id,
      },
    });

    const participants = await prisma.Participant.findMany({
      where: {
        sessionId: +id,
      },
    });

    const assignments = await prisma.assignments.findMany({});

    if (!data) return res.redirect("/manager/sessions");

    res.render("manager/singleSession", {
      session: data,
      participants,
      assignments,
    });
  } catch (error) {
    console.log("🚀 ~ file: managerRouter.js:56 ~ router.get ~ error:", error);
    res.status(400).json({ error });
  }
});

router.get("/participants", async (req, res) => {
  try {
    const data = await prisma.Participant.findMany();

    const sessions = await prisma.trainingsessions.findMany();
    res.render("manager/participants", { participants: data, sessions });
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

    res.render("manager/monitors", { monitors });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/centers", async (req, res) => {
  try {
    const centers = await prisma.centers.findMany();

    res.render("manager/centers", { centers });
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

    res.render("manager/trainers", { trainers: allTrainers });
  } catch (error) {
    console.log("error trainer: ", error);
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

    res.render("manager/assignments", { assignments });
  } catch (error) {
    console.log("error manager assignments: ", error);
  }
});

router.get("/feedbacks", async (req, res) => {
  res.render("manager/feedbacks");
});

router.get("/user/create", async (req, res) => {
  try {
    const programs = await prisma.programs.findMany();

    res.render("manager/createUser", { programs });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.get("/reports", (req, res) => {
  res.render("manager/reports");
});

router.post("/participant/create", async (req, res) => {
  const { name, cnic, email, contact, sessionId } = req.body;

  try {
    if (!name && !cnic && !email && !contact && !sessionId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const data = await prisma.Participant.create({
      data: {
        name,
        cnic,
        email,
        contact,
        sessionId: +sessionId,
      },
    });

    await prisma.users.create({
      data: {
        Username: name,
        Password: String(cnic),
        Email: email,
        UserType: UserType.STUDENT,
      },
    });

    res.redirect("/manager/participants");
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("participant/create-bulk", async (req, res) => {
  const file = req.files.file;

  const uploadsDirectory = join(process.cwd(), "public", "uploads");

  try {
    let filePath = join(uploadsDirectory, file.name);

    file.mv(filePath, (err) => {
      if (err) console.log("🚀 ~ file.mv ~ err:", err);
    });

    const result = excelToJson({
      sourceFile: filePath,
      header: {
        rows: 1,
      },
      columnToKey: {
        "*": "{{columnHeader}}",
      },
      sheets: ["Sheet1"],
    });
    console.log("🚀 ~ router.post ~ result:", result.Sheet1);

    result.Sheet1.map(async (item) => {
      await prisma.Participant.create({
        data: {
          name: item.name,
          cnic: String(item.cnic),
          email: item.email,
          contact: String(item.contact),
          sessionId: +item.session,
        },
      });
      await prisma.users.create({
        data: {
          Username: item.name,
          Password: String(item.cnic),
          Email: item.email,
        },
      });
    });
    const data = res.redirect("/manager/participants");
  } catch (error) {
    console.log("🚀 ~ router.post ~ error:", error);
    res.status(400).json({ message: "no bro" });
  }
});

export default router;
