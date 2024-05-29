import { Router } from "express";
import { join } from "path";

import { UserType } from "@prisma/client";
import { hash } from "bcrypt";
import excelToJson from "convert-excel-to-json";
import { existsSync, unlinkSync } from "fs";
import prisma from "../lib/db.js";

const router = Router();

router.post("/create", async (req, res) => {
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

    const program = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +sessionId,
      }
    })

let hashedPassword = await hash(cnic, 10);

    await prisma.users.create({
      data: {
        Username: name,
        Password: hashedPassword,
        Email: email,
        UserType: UserType.STUDENT,
        SessionID: sessionId,
        ProgramID: `${program.ProgramID}`
      },
    });

    res.redirect("/admin/participants");
  } catch (error) {
    console.log("🚀 ~ router.post ~ error url='/participant/create'", error)
    res.status(400).json({ error });
  }
});

router.post("/create-bulk", async (req, res) => {
  const file = req.files.file;

  const uploadsDirectory = join(process.cwd(), "public", "uploads");
  console.log(existsSync(uploadsDirectory));

  try {
    let filePath = join(uploadsDirectory, file.name);

    await file.mv(filePath, (err) => {
      if (err) console.log("🚀 ~ file.mv ~ err:", err);
    });
    setTimeout(() => {
      const exists = existsSync(filePath);

      if (exists) {
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
          let hashedPassword = await hash(item.cnic, 10);
          await prisma.users.create({
            data: {
              Username: item.name,
              Password: hashedPassword,
              Email: item.email,
              SessionID: +item.sessiod,
            },
          });
        });
        unlinkSync(filePath);
        res.status(201).json({
          redirectTo: "/admin/participants",
        });
      }
    }, 3000);
  } catch (error) {
    console.log("🚀 ~ router.post ~ error:", error);
    res.status(400).json({ message: "no bro" });
  }
});

// router.get("/", getPrograms);

router.get("/:id", async (req, res) => {
  try {
    const data = await prisma.Participant.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!data) return res.status(400).json({ message: "something went wrong" });

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default router;
