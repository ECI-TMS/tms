import { Router } from "express";
import { join } from "path";

import { UserType } from "@prisma/client";
import { hash } from "bcrypt";
import excelToJson from "convert-excel-to-json";
import { existsSync, unlinkSync } from "fs";
import prisma from "../lib/db.js";

const router = Router();
// ================================================>
router.post("/create", async (req, res) => {
  const { name, cnic, email, contact, sessionId ,program_id,course_id } = req.body;

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
        program_id:+program_id,
        sessionId: +sessionId,
      },
    });



    const program = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +sessionId,
      }
    })



    let userAsPart = await prisma.users.findFirst({
      where: { Email: email },
    });

    if(!userAsPart){
    let hashedPassword = await hash(cnic, 10);
     userAsPart  = await prisma.users.create({
      data: {
        Username: name,
        Password: hashedPassword,
        Email: email,
        UserType: UserType.STUDENT,
        SessionID: +sessionId,
        ProgramID: `${program.ProgramID}`,
        ParticipantID: +data.id
      },
    });

  }


    const newProgramUser = await prisma.programUsers.create({
      data: {
        UserID: +userAsPart.UserID,
        ProgramID: +program_id,
        SessionID: +sessionId,
      },
    });


    res.redirect(`/admin/program/${program_id}/course/${course_id}/session/${+sessionId}/participants`);
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
         let participantData = await prisma.Participant.create({
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
              ParticipantID: +participantData.id 
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


// DELETE route for deleting a participant
router.delete("/deleteParticipant/:id", async (req, res) => {
  try {
    const participantId = req.params.id;

    // First check if the participant exists
    const existingParticipant = await prisma.participant.findUnique({
      where: {
        id: +participantId,
      },
    });

    if (!existingParticipant) {
      return res.status(404).json({ 
        message: "Participant not found",
        success: false 
      });
    }

    // Delete the user by matching email with participant email
    const user = await prisma.users.findFirst({
      where: { Email: existingParticipant.email },
    });

    if (user) {
      // Clean ProgramUsers first to satisfy FK constraint, then delete the user
      await prisma.programUsers.deleteMany({ where: { UserID: user.UserID } });
      await prisma.users.delete({ where: { UserID: user.UserID } });
    }

    // Delete the participant
    const deletedParticipant = await prisma.participant.delete({
      where: {
        id: +participantId,
      },
    });

    // Return success response
    res.status(200).json({
      message: "Participant deleted successfully",
      success: true,
      deletedParticipant: deletedParticipant
    });

  } catch (error) {
    console.error("Error deleting participant:", error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({
        message: "Participant not found or already deleted",
        success: false
      });
    }

    // Handle foreign key constraint errors (if participant is referenced elsewhere)
    if (error.code === 'P2003') {
      return res.status(400).json({
        message: "Cannot delete participant: participant is referenced in other records",
        success: false
      });
    }

    // Generic error response
    res.status(500).json({
      message: "Internal server error while deleting participant",
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
