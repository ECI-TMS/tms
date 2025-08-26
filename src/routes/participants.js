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
    // Validate required fields similar to bulk logic
    if (!name || !cnic || !email || !contact || !sessionId || !program_id) {
      await prisma.duplicateParticipant.create({
        data: {
          name: name || 'N/A',
          cnic: String(cnic || 'N/A'),
          email: email || 'N/A',
          contact: String(contact || 'N/A'),
          sessionId: +sessionId,
          program_id: +program_id,
          reason: 'Missing required fields'
        }
      });
      const msg = encodeURIComponent('Missing required fields. Saved to duplicates.');
      return res.redirect(`/admin/program/${program_id}/course/${course_id}/session/${+sessionId}/participants?msg=${msg}&type=error`);
    }

    // Check duplicate email (case-insensitive) similar to bulk logic
    const trimmedEmail = email.trim().toLowerCase();
    const existingUsers = await prisma.$queryRaw`SELECT * FROM users WHERE LOWER(Email) = ${trimmedEmail}`;
    const existingUser = existingUsers[0] || null;

    if (existingUser) {
      await prisma.duplicateParticipant.create({
        data: {
          name,
          cnic: String(cnic),
          email,
          contact: String(contact),
          sessionId: +sessionId,
          program_id: +program_id,
          reason: 'Email already exists in system'
        }
      });
      const msg = encodeURIComponent('Email already exists. Saved to duplicates.');
      return res.redirect(`/admin/program/${program_id}/course/${course_id}/session/${+sessionId}/participants?msg=${msg}&type=error`);
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


// DELETE route for deleting a participant (Soft Delete)
router.delete("/deleteParticipant/:id", async (req, res) => {
  try {
    const participantId = req.params.id;

    // First check if the participant exists and is not already deleted
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

    // Check if participant is already soft deleted
    if (existingParticipant.deletedAt) {
      return res.status(400).json({ 
        message: "Participant is already deleted",
        success: false 
      });
    }

    // Soft delete the participant by setting deletedAt timestamp
    const deletedParticipant = await prisma.participant.update({
      where: {
        id: +participantId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Soft delete the associated user if exists
    const user = await prisma.users.findFirst({
      where: { Email: existingParticipant.email },
    });

    if (user) {
      await prisma.users.update({
        where: { UserID: user.UserID },
        data: {
          deletedAt: new Date(),
        },
      });
    }

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

// RESTORE route for restoring a deleted participant
router.post("/restoreParticipant/:id", async (req, res) => {
  try {
    const participantId = req.params.id;

    // Check if the participant exists and is soft deleted
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

    // Check if participant is not deleted (can't restore if not deleted)
    if (!existingParticipant.deletedAt) {
      return res.status(400).json({ 
        message: "Participant is not deleted and cannot be restored",
        success: false 
      });
    }

    // Restore the participant by removing deletedAt timestamp
    const restoredParticipant = await prisma.participant.update({
      where: {
        id: +participantId,
      },
      data: {
        deletedAt: null,
      },
    });

    // Restore the associated user if exists
    const user = await prisma.users.findFirst({
      where: { Email: existingParticipant.email },
    });

    if (user && user.deletedAt) {
      await prisma.users.update({
        where: { UserID: user.UserID },
        data: {
          deletedAt: null,
        },
      });
    }

    // Return success response
    res.status(200).json({
      message: "Participant restored successfully",
      success: true,
      restoredParticipant: restoredParticipant
    });

  } catch (error) {
    console.error("Error restoring participant:", error);
    
    res.status(500).json({
      message: "Internal server error while restoring participant",
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PERMANENT DELETE route for permanently removing a participant after undo timeout
router.delete("/permanentlyDeleteParticipant/:id", async (req, res) => {
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

    // Permanently delete the participant from database (not soft delete)
    await prisma.participant.delete({
      where: {
        id: +participantId,
      },
    });

    // Permanently delete the associated user if exists
    const user = await prisma.users.findFirst({
      where: { Email: existingParticipant.email },
    });

    if (user) {
      await prisma.users.delete({
        where: { UserID: user.UserID },
      });
    }

    // Return success response
    res.status(200).json({
      message: "Participant permanently deleted from database",
      success: true
    });

  } catch (error) {
    console.error("Error permanently deleting participant:", error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({
        message: "Participant not found",
        success: false
      });
    }

    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return res.status(400).json({
        message: "Cannot delete participant: participant is referenced in other records",
        success: false
      });
    }

    // Generic error response
    res.status(500).json({
      message: "Internal server error while permanently deleting participant",
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
