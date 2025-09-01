import { UserType } from "@prisma/client";
import { hash } from "bcrypt";
import { Router } from "express";
import prisma from "../lib/db.js";
import authMiddleware from "../middlewares/authmiddleware.js";
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import extract from 'extract-zip';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { log } from "console";
import multer from 'multer';
import xlsx from "xlsx";

const execAsync = promisify(exec);

const router = Router();


const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'documents');
// const storage = multer.diskStorage({
//   destination: (_, __, cb) => cb(null, uploadPath),
//   filename: (_, file, cb) => {
//     const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     cb(null, `${unique}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Preserve original filename with timestamp to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname;
    cb(null, originalName);
  }
})

const upload = multer({ storage: storage })


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
  try {
    const programsCount = await prisma.programs.count();

    const trainersCount = await prisma.users.count({
      where: { UserType: "TRAINER" },
    });

    const monitorsCount = await prisma.users.count({
      where: { UserType: "MONITOR" },
    });

    const participantsCount = await prisma.participant.count();

    const trainingSessionsCount = await prisma.trainingsessions.count();

    const coursesCount = await prisma.course.count();

    res.render("admin/dashboard", {
      counts: {
        programs: programsCount,
        trainers: trainersCount,
        monitors: monitorsCount,
        participants: participantsCount,
        trainingsessions: trainingSessionsCount,
        courses: coursesCount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard counts:", error);
    res.status(500).send("Internal Server Error");
  }
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

router.delete("/organizations/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.thirdparties.delete({
      where: {
        ThirdPartyID: parseInt(id),
      },
    });
    res.status(200).json({ message: "Client deleted successfully." });
  } catch (error) {
    console.error("Failed to delete client:", error);
    res.status(500).json({ error: "Failed to delete client." });
  }
});

router.get("/organization/edit/:id", async (req, res) => {
  try {
    const organizationId = +req.params.id;
    
    // Get the organization
    const organization = await prisma.thirdparties.findFirst({
      where: {
        ThirdPartyID: organizationId
      },
    });

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.render("admin/editOrganization", { 
      organization 
    });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(500).json({ error: "Failed to fetch organization for editing" });
  }
});

router.post("/organization/update/:id", async (req, res) => {
  try {
    const organizationId = +req.params.id;
    const { Name } = req.body;

    // Validate required fields
    if (!Name) {
      return res.status(400).json({ 
        status: false, 
        error: "Missing fields", 
        message: "Name is required" 
      });
    }

    // Update the organization
    const updatedOrganization = await prisma.thirdparties.update({
      where: {
        ThirdPartyID: organizationId,
      },
      data: {
        Name,
      },
    });

    if (!updatedOrganization) {
      return res.status(400).json({ status: false, error: "Failed to update organization" });
    }

    // Respond with success JSON
    return res.status(200).json({ status: true, message: "Organization updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || error });
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
  const programId = +req.params.programId;
  const courseId = +req.params.id;

  try {
    const course = await prisma.course.findFirst({
      where: {
        CourseID: courseId,
      },
    });

    const sessions = await prisma.trainingsessions.findMany({
      where: {
        CourseID: courseId,
      },
      include: {
        course: true,
        programs: true,
      },
    });

    // ✅ Fetch the program
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: programId,
      },
    });

    // ✅ Pass program to the view
    res.render("admin/singleCourse", {
      sessions,
      course,
      programId,
      courseId,
      program, // 👈 new
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});


router.delete('/programs/:programId/courses/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);

    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid CourseID' });
    }

    const deletedCourse = await prisma.course.delete({
      where: {
        CourseID: courseId,
      },
    });

    console.log('Deleted course:', deletedCourse);
    res.status(200).json({ message: 'Successfully deleted!' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(400).json({ error: 'Failed to delete session.' });
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

router.get("/program/:programId/course/:courseId/session/:id/duplicates", async (req, res) => {
  try {
    const sessionId = +req.params.id;
    const programId = +req.params.programId;
    const courseId = +req.params.courseId;
    
    console.log('Fetching duplicate participants for sessionId:', sessionId);
    
    const duplicateParticipants = await prisma.duplicateParticipant.findMany({
      where: {
        sessionId: sessionId,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Found duplicate participants:', duplicateParticipants.length);

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: sessionId,
      },
    });

    console.log('Found session:', session ? session.SessionID : 'null');

    res.render(`admin/duplicateParticipants`, {
      duplicateParticipants,
      session,
      sessionId,
      programId,
      courseId
    });
  } catch (error) {
    console.error('Error in duplicates route:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'An error occurred while fetching duplicate participants',
      details: error.toString()
    });
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
        deletedAt: null, // Exclude soft-deleted participants
      },
    });

    const assignments = await prisma.assignments.count({
      where: {
        SessionID: +id,
      },
    });

    const documents = await prisma.admin_docs.count({
      where: {
        sessionId: +id,
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

router.delete('/program/:programId/course/:courseId/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    

    const deletedSession = await prisma.trainingsessions.delete({
      where: {
        SessionID: +id,
      },
    });

    console.log('Deleted session:', deletedSession);
    res.status(200).json({ message: 'Successfully deleted!' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(400).json({ error: 'Failed to delete session.' });
  }
});

router.get("/program/:programId/course/:courseId/session/:id/participants", async (req, res) => {
  try {
    const  sessionId  =  +req.params.id;
    const  programId  =  +req.params.programId;
    const  courseId  =  +req.params.courseId;
    const { msg, type } = req.query;
    const participants = await prisma.Participant.findMany({
      where: {
        sessionId: +req.params.id,
        deletedAt: null, // Exclude soft-deleted participants
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
      courseId,
      message: msg || null,
      messageType: type || null
    });
  } catch (error) {
    res.status(400).json({ error });
  }
});

// Edit participant route
router.get("/program/:programId/course/:courseId/session/:sessionId/participant/:id/edit", async (req, res) => {
  try {
    const participantId = +req.params.id;
    const programId = +req.params.programId;
    const courseId = +req.params.courseId;
    const sessionId = +req.params.sessionId;

    // Get participant with related user data
    const participant = await prisma.Participant.findFirst({
      where: {
        id: participantId,
      },
      include: {
        user: true,
      },
    });

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Get sessions for dropdown
    const sessions = await prisma.trainingsessions.findMany({
      where: {
        ProgramID: programId,
      },
    });

    res.render("admin/editParticipant", {
      participant,
      sessions,
      programId,
      courseId,
      sessionId,
    });
  } catch (error) {
    console.log("Error fetching participant:", error);
    res.status(400).json({ error });
  }
});

// Update participant route
router.post("/program/:programId/course/:courseId/session/:sessionId/participant/:id/edit", async (req, res) => {
  try {
    const participantId = +req.params.id;
    const programId = +req.params.programId;
    const courseId = +req.params.courseId;
    const sessionId = +req.params.sessionId;
    const { name, cnic, email, contact, newSessionId } = req.body;

    // Validate required fields
    if (!name || !cnic || !email || !contact || !newSessionId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email already exists for other participants
    const existingParticipant = await prisma.Participant.findFirst({
      where: {
        email: email,
        id: { not: participantId },
      },
    });

    if (existingParticipant) {
      return res.status(400).json({ error: "Email already exists for another participant" });
    }

    // Check if email already exists in users table
    const existingUser = await prisma.users.findFirst({
      where: {
        Email: email,
        ParticipantID: { not: participantId },
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: "A user with this email already exists in the system" });
    }

    // Update participant
    const updatedParticipant = await prisma.Participant.update({
      where: {
        id: participantId,
      },
      data: {
        name,
        cnic,
        email,
        contact,
        sessionId: +newSessionId,
      },
    });

    // Update associated user if exists
    if (updatedParticipant.user) {
      await prisma.users.update({
        where: {
          UserID: updatedParticipant.user.UserID,
        },
        data: {
          Username: name,
          Email: email,
          SessionID: +newSessionId,
        },
      });

      // Update ProgramUsers record
      await prisma.programUsers.updateMany({
        where: {
          UserID: updatedParticipant.user.UserID,
          ProgramID: programId,
        },
        data: {
          SessionID: +newSessionId,
        },
      });
    }

    res.redirect(`/admin/program/${programId}/course/${courseId}/session/${sessionId}/participants`);
  } catch (error) {
    console.log("Error updating participant:", error);
    res.status(400).json({ error });
  }
});

router.delete("/duplicate-participant/:id", async (req, res) => {
  try {
    const duplicateId = +req.params.id;
    
    await prisma.duplicateParticipant.delete({
      where: {
        id: duplicateId
      }
    });

    res.status(200).json({ message: 'Duplicate participant deleted successfully!' });
  } catch (error) {
    console.error('Error deleting duplicate participant:', error);
    res.status(500).json({ error: 'Failed to delete duplicate participant.' });
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
      include: {
        course: true,
        programs: true,
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

// New route to handle assignment deletion
router.delete("/session/:sessionId/assignments/:assignmentId/delete", authMiddleware, async (req, res) => {
  try {
    const { sessionId, assignmentId } = req.params;

    await prisma.assignments.delete({
      where: {
        AssignmentID: +assignmentId
      }
    });

    res.status(200).json({ message: 'Assignment deleted successfully!' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(400).json({ error: 'Failed to delete assignment.' });
  }
});

// Edit assignment route
router.get("/assignment/:id/edit", authMiddleware, async (req, res) => {
  try {
    const assignmentId = +req.params.id;
    
    const assignment = await prisma.assignments.findFirst({
      where: { AssignmentID: assignmentId },
      include: {
        trainingsessions: {
          include: {
            course: true,
            programs: true,
            users_trainingsessions_TrainerIDTousers: true,
            users_trainingsessions_MonitorIDTousers: true,
          }
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.render("admin/editAssignment", { assignment });
  } catch (error) {
    console.log("Error fetching assignment:", error);
    res.status(400).json({ error });
  }
});

// Update assignment route
router.post("/assignment/:id/edit", authMiddleware, async (req, res) => {
  try {
    const assignmentId = +req.params.id;
    const { Title, Deadline } = req.body;
    const template = req.files?.template;

    if (!Title || !Deadline) {
      return res.status(400).json({ error: "Title and deadline are required" });
    }

    // Get the current assignment to get the session ID
    const currentAssignment = await prisma.assignments.findFirst({
      where: { AssignmentID: assignmentId },
    });

    if (!currentAssignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    let updateData = {
      Title,
      Deadline: new Date(Deadline).toLocaleDateString(),
    };

    // Handle file upload if provided
    if (template) {
      // Create session-specific directory
      const uploadsDirectory = path.join(process.cwd(), 'uploads');
      const sessionDirectory = path.join(uploadsDirectory, `${currentAssignment.SessionID}`);
      
      if (!fs.existsSync(uploadsDirectory)) {
        fs.mkdirSync(uploadsDirectory, { recursive: true });
      }
      
      if (!fs.existsSync(sessionDirectory)) {
        fs.mkdirSync(sessionDirectory, { recursive: true });
      }
      
      // Save file to session directory
      const filePath = path.join(sessionDirectory, template.name);
      await template.mv(filePath);
      
      // Use the same path structure as assignment creation: /uploads/{sessionId}/
      const relativePath = filePath.split(process.cwd())[1].replace("\\public", "");
      updateData.FilePath = relativePath;
    }

    const updatedAssignment = await prisma.assignments.update({
      where: { AssignmentID: assignmentId },
      data: updateData,
    });

    res.redirect(`/admin/session/${updatedAssignment.SessionID}/assignments`);
  } catch (error) {
    console.log("Error updating assignment:", error);
    res.status(400).json({ error: error.message || "An error occurred while updating the assignment" });
  }
});

// Delete assignment route
router.delete("/assignment/:id/delete", authMiddleware, async (req, res) => {
  try {
    const assignmentId = +req.params.id;

    const assignment = await prisma.assignments.findFirst({
      where: { AssignmentID: assignmentId },
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Delete the assignment
    await prisma.assignments.delete({
      where: { AssignmentID: assignmentId },
    });

    res.json({ success: true, message: "Assignment deleted successfully" });
  } catch (error) {
    console.log("Error deleting assignment:", error);
    res.status(500).json({ success: false, error: error.message || error });
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

// New route to handle file uploads for session documents
router.post("/session/:sessionId/documents/upload", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { programId } = req.body;
    const file = req.files?.file;

    // Validate required fields
    if (!file || !programId) {
      return res.status(400).json({ 
        success: false, 
        message: "File and program ID are required" 
      });
    }

    // Get session to validate it exists
    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +sessionId,
      },
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: "Session not found" 
      });
    }

    // Create adminDocs directory inside uploads folder if it doesn't exist
    const adminDocsPath = path.join(process.cwd(), 'public', 'uploads', 'adminDocs');
    if (!fs.existsSync(adminDocsPath)) {
      fs.mkdirSync(adminDocsPath, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.name;
    const fileExtension = path.extname(originalName);
    const fileName = `admin-doc-${uniqueSuffix}${fileExtension}`;
    
    // Save file to adminDocs folder
    const filePath = path.join(adminDocsPath, fileName);
    await file.mv(filePath);

    // Create relative path for database storage
    const relativePath = `/uploads/adminDocs/${fileName}`;

    // Save document info to database
    const savedDocument = await prisma.admin_docs.create({
      data: {
        sessionId: +sessionId,
        programId: +programId,
        filename: originalName,
        filepath: relativePath,
      },
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      document: {
        id: savedDocument.id,
        filename: savedDocument.filename,
        filepath: savedDocument.filepath,
        createdAt: savedDocument.createdAt
      }
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
});

// Route to get all admin documents for a session
router.get("/session/:sessionId/documents/admin", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const adminDocuments = await prisma.admin_docs.findMany({
      where: {
        sessionId: +sessionId,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      documents: adminDocuments
    });

  } catch (error) {
    console.error("Error fetching admin documents:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
});

// Route to get admin document for editing
router.get("/session/:sessionId/documents/admin/:documentId/edit", async (req, res) => {
  try {
    const { sessionId, documentId } = req.params;
    
    const document = await prisma.admin_docs.findFirst({
      where: {
        id: +documentId,
        sessionId: +sessionId,
      },
    });

    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: "Document not found" 
      });
    }

    res.json({
      success: true,
      document: document
    });

  } catch (error) {
    console.error("Error fetching admin document:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
});

// Route to update admin document
router.post("/session/:sessionId/documents/admin/:documentId/edit", async (req, res) => {
  try {
    const { sessionId, documentId } = req.params;
    const { filename } = req.body;
    const file = req.files?.file;

    // Get the existing document
    const existingDocument = await prisma.admin_docs.findFirst({
      where: {
        id: +documentId,
        sessionId: +sessionId,
      },
    });

    if (!existingDocument) {
      return res.status(404).json({ 
        success: false, 
        message: "Document not found" 
      });
    }

    let updateData = {
      filename: filename
    };

    // Handle file upload if provided
    if (file) {
      // Create adminDocs directory if it doesn't exist
      const adminDocsPath = path.join(process.cwd(), 'public', 'uploads', 'adminDocs');
      if (!fs.existsSync(adminDocsPath)) {
        fs.mkdirSync(adminDocsPath, { recursive: true });
      }

      // Delete old file if it exists
      if (existingDocument.filepath) {
        const oldFilePath = path.join(process.cwd(), 'public', existingDocument.filepath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const originalName = file.name;
      const fileExtension = path.extname(originalName);
      const fileName = `admin-doc-${uniqueSuffix}${fileExtension}`;
      
      // Save new file
      const filePath = path.join(adminDocsPath, fileName);
      await file.mv(filePath);

      // Update filepath
      const relativePath = `/uploads/adminDocs/${fileName}`;
      updateData.filepath = relativePath;
    }

    // Update document in database
    const updatedDocument = await prisma.admin_docs.update({
      where: {
        id: +documentId,
      },
      data: updateData,
    });

    res.json({
      success: true,
      message: "Document updated successfully",
      document: {
        id: updatedDocument.id,
        filename: updatedDocument.filename,
        filepath: updatedDocument.filepath,
        createdAt: updatedDocument.createdAt
      }
    });

  } catch (error) {
    console.error("Error updating admin document:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
});

// Route to delete admin document
router.delete("/session/:sessionId/documents/admin/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Get document info before deletion
    const document = await prisma.admin_docs.findUnique({
      where: {
        id: +documentId
      }
    });

    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: "Document not found" 
      });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'public', document.filepath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.admin_docs.delete({
      where: {
        id: +documentId
      }
    });

    res.json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
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
      programId,
      courseId:+req.params.courseId
    });

  } catch (error) {
    res.status(400).json({ error });
  }
});

// Edit material route
router.post("/materials/:materialId/edit", async (req, res) => {
  try {
    const { materialId } = req.params;
    const { title } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: "Material title is required" 
      });
    }

    // Check if material exists
    const existingMaterial = await prisma.materials.findUnique({
      where: { MaterialID: +materialId }
    });

    if (!existingMaterial) {
      return res.status(404).json({ 
        success: false, 
        message: "Material not found" 
      });
    }

    let updateData = {
      Title: title.trim()
    };

    // Handle file upload if provided
    if (req.files && req.files.file) {
      const file = req.files.file;
      const fileName = file.name;
      const filePath = `/uploads/materials/${materialId}_${Date.now()}_${fileName}`;
      
      // Save file to uploads directory
      await file.mv(`./public${filePath}`);
      
      // Update file path
      updateData.FilePath = filePath;
    }

    // Update material
    await prisma.materials.update({
      where: { MaterialID: +materialId },
      data: updateData
    });

    res.json({ 
      success: true, 
      message: "Material updated successfully" 
    });

  } catch (error) {
    console.error("Error updating material:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
});

// Delete material route
router.delete("/materials/:materialId", async (req, res) => {
  try {
    const { materialId } = req.params;

    // Check if material exists
    const existingMaterial = await prisma.materials.findUnique({
      where: { MaterialID: +materialId }
    });

    if (!existingMaterial) {
      return res.status(404).json({ 
        success: false, 
        message: "Material not found" 
      });
    }

    // Delete material from database
    await prisma.materials.delete({
      where: { MaterialID: +materialId }
    });

    // TODO: Optionally delete the physical file from server
    // const filePath = `./public${existingMaterial.FilePath}`;
    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);
    // }

    res.json({ 
      success: true, 
      message: "Material deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting material:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
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
      select: {
        SessionID: true,
        ProgramID: true,
        CourseID: true,
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
    const quiz = await prisma.Quiz.findFirst({
      where: {
        id: +req.params.quizId,
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
      select: {
        SessionID: true,
        ProgramID: true,
        CourseID: true,
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.render("admin/quizQuestions", {
      quiz,
      questions: quiz.questions,
      session,
    });
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    res.status(400).json({ error });
  }
});

// Update question route
router.put("/quiz/:quizId/question/:questionId/update", async (req, res) => {
  try {
    const { quizId, questionId } = req.params;
    const { question, answer, options } = req.body;

    if (!question || !answer || !options || options.length !== 4) {
      return res.status(400).json({ 
        success: false, 
        message: "Question, answer, and exactly 4 options are required" 
      });
    }

    // Update the question
    await prisma.QuizQuestion.update({
      where: { id: +questionId },
      data: {
        question: question.trim(),
        answer: answer.trim(),
      },
    });

    // Delete existing options
    await prisma.Option.deleteMany({
      where: { questionId: +questionId },
    });

    // Create new options
    await prisma.Option.createMany({
      data: options.map(option => ({
        value: option.trim(),
        questionId: +questionId,
      })),
    });

    res.json({ 
      success: true, 
      message: "Question updated successfully" 
    });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update question",
      error: error.message 
    });
  }
});

// Delete question route
router.delete("/quiz/:quizId/question/:questionId/delete", async (req, res) => {
  try {
    const { quizId, questionId } = req.params;

    // Delete options first
    await prisma.Option.deleteMany({
      where: { questionId: +questionId },
    });

    // Delete the question
    await prisma.QuizQuestion.delete({
      where: { id: +questionId },
    });

    res.json({ 
      success: true, 
      message: "Question deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete question",
      error: error.message 
    });
  }
});

// Get question data route
router.get("/quiz/:quizId/question/:questionId/data", async (req, res) => {
  try {
    const { quizId, questionId } = req.params;

    const question = await prisma.QuizQuestion.findFirst({
      where: { 
        id: +questionId,
        quizId: +quizId
      },
      include: {
        options: true,
      },
    });

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: "Question not found" 
      });
    }

    res.json({ 
      success: true, 
      question: question
    });
  } catch (error) {
    console.error("Error fetching question data:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch question data",
      error: error.message 
    });
  }
});

// Add new question route
router.post("/quiz/:quizId/question/add", async (req, res) => {
  try {
    const { quizId } = req.params;
    const { question, answer, options } = req.body;

    if (!question || !answer || !options || options.length !== 4) {
      return res.status(400).json({ 
        success: false, 
        message: "Question, answer, and exactly 4 options are required" 
      });
    }

    // Create the question with options
    const newQuestion = await prisma.QuizQuestion.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        quizId: +quizId,
        options: {
          create: options.map(option => ({
            value: option.trim(),
          })),
        },
      },
      include: {
        options: true,
      },
    });

    res.json({ 
      success: true, 
      message: "Question added successfully",
      question: newQuestion
    });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to add question",
      error: error.message 
    });
  }
});

router.get('/documents', async (req, res) => {
  try {
    const documents = await prisma.documentType.findMany();
    res.render('admin/documents', { documents });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post('/document/create', async (req, res) => {
  const { Name } = req.body;
  const file = req.files?.file;

  // Ensure upload directory exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  try {
    if (!Name || !file) {
      return res.status(400).json({ message: 'Name and file are required' });
    }

    const documentExist = await prisma.documentType.findFirst({ where: { Name } });

    if (documentExist) {
      return res.status(400).json({ message: `Document ${Name} already exists` });
    }

    // Save file with unique name
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.name}`;
    const filePath = path.join(uploadPath, uniqueName);

    await file.mv(filePath);
    const relativePath = `/uploads/documents/${uniqueName}`;

    const newDocument = await prisma.documentType.create({
      data: {
        Name,
        file: relativePath,
      },
    });

    res.redirect('/admin/documents');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/document/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const doc = await prisma.documentType.findUnique({ where: { DocumentTypeID: id } });

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const fileName = path.basename(doc.file);
    const filePath = path.join(uploadPath, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.documentType.delete({ where: { DocumentTypeID: id } });

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get("/document/edit/:id", async (req, res) => {
  try {
    const documentId = +req.params.id;
    
    // Get the document
    const document = await prisma.documentType.findFirst({
      where: {
        DocumentTypeID: documentId
      },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.render("admin/editDocument", { 
      document 
    });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(500).json({ error: "Failed to fetch document for editing" });
  }
});

router.post("/document/update/:id", async (req, res) => {
  try {
    const documentId = +req.params.id;
    const { Name } = req.body;
    const file = req.files?.file;

    // Validate required fields
    if (!Name) {
      return res.status(400).json({ 
        status: false, 
        error: "Missing fields", 
        message: "Name is required" 
      });
    }

    // Get the existing document
    const existingDocument = await prisma.documentType.findFirst({
      where: {
        DocumentTypeID: documentId
      },
    });

    if (!existingDocument) {
      return res.status(404).json({ 
        status: false, 
        error: "Document not found" 
      });
    }

    let filePath = existingDocument.file; // Keep existing file if no new file uploaded

    // If a new file is uploaded, save it and update the file path
    if (file) {
      // Ensure upload directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      // Delete the old file if it exists
      if (existingDocument.file) {
        const oldFileName = path.basename(existingDocument.file);
        const oldFilePath = path.join(uploadPath, oldFileName);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Save new file with unique name
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.name}`;
      const newFilePath = path.join(uploadPath, uniqueName);

      await file.mv(newFilePath);
      filePath = `/uploads/documents/${uniqueName}`;
    }

    // Update the document
    const updatedDocument = await prisma.documentType.update({
      where: {
        DocumentTypeID: documentId,
      },
      data: {
        Name,
        file: filePath,
      },
    });

    if (!updatedDocument) {
      return res.status(400).json({ status: false, error: "Failed to update document" });
    }

    // Respond with success JSON
    return res.status(200).json({ status: true, message: "Document updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || error });
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

// Edit quiz name route
router.put("/quiz/:id/edit", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: "Quiz name is required" 
      });
    }

    const updatedQuiz = await prisma.Quiz.update({
      where: { id: +id },
      data: { name: name.trim() },
      include: {
        SubmittedQuizes: true,
      },
    });

    res.json({ 
      success: true, 
      message: "Quiz updated successfully",
      quiz: updatedQuiz
    });
  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update quiz",
      error: error.message 
    });
  }
});

// Delete quiz and all related data route
router.delete("/quiz/:id/delete", async (req, res) => {
  try {
    const { id } = req.params;

    // First, check if quiz exists
    const quiz = await prisma.Quiz.findUnique({
      where: { id: +id },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        SubmittedQuizes: true,
      },
    });

    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        message: "Quiz not found" 
      });
    }

    // Delete all related data in the correct order
    // 1. Delete submitted quiz answers
    if (quiz.SubmittedQuizes.length > 0) {
      await prisma.SubmittedQuiz.deleteMany({
        where: { QuizID: +id },
      });
    }

    // 2. Delete question options
    for (const question of quiz.questions) {
      if (question.options.length > 0) {
        await prisma.Option.deleteMany({
          where: { questionId: question.id },
        });
      }
    }

    // 3. Delete questions
    await prisma.QuizQuestion.deleteMany({
      where: { quizId: +id },
    });

    // 4. Finally delete the quiz
    await prisma.Quiz.delete({
      where: { id: +id },
    });

    res.json({ 
      success: true, 
      message: "Quiz and all related data deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete quiz",
      error: error.message 
    });
  }
});

router.get("/programs/:programId/courses/:id/session/create", async (req, res) => {

  
  try {
    const programId = req.params.programId;

    

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
    const courses = await prisma.course.findMany({
      where: {
        ProgramID: +programId,
      },

    });
    const course_id = req.params.id;
    
    

    res.render("admin/createSession", { trainers, monitors, centers, courses ,course_id ,programId});
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/program/:programId/course/:courseId/sessions/:id/edit", async (req, res) => {
  try {
    const id = req.params.id;
    const programId = +req.params.programId;
    const courseId = +req.params.courseId;

    const session = await prisma.trainingsessions.findFirst({
      where: {
        SessionID: +id,
      },
      include: {
        course: true,
        programs: true,
        users_trainingsessions_TrainerIDTousers: true,
        users_trainingsessions_MonitorIDTousers: true,
      },
    });

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
    const courses = await prisma.course.findMany({
      where: {
        ProgramID: +programId,
      },
    });

    if (!session) return res.redirect("/admin/program/:programId/course/:courseId/");

     // Format dates for input fields
     const formatDate = (date) => {
      const d = new Date(date);
      const month = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      return [d.getFullYear(), month, day].join('-');
    };

    session.StartDate = formatDate(session.StartDate);
    session.EndDate = formatDate(session.EndDate);

    // Debug: Log session center and centers for comparison
    console.log("Session Center:", session.Center);
    console.log("Available Centers:", centers.map(c => c.Name));
    console.log("Session Center type:", typeof session.Center);
    console.log("Center names types:", centers.map(c => ({ name: c.Name, type: typeof c.Name })));

    
    res.render("admin/editSession", {
      session,
      centers,
      trainers,
      monitors,
      courses,
      programId,
      courseId,
    });
  } catch (error) {
    console.log("Error fetching session:", error);
    res.status(400).json({ error });
  }
});

router.post("/program/:programId/course/:courseId/sessions/:id/edit", async (req, res) => {
  try {
    const { id, programId, courseId } = req.params;
    const { Center, StartDate, EndDate, TrainerID, MonitorID, CourseID } = req.body;

     // Update session
     await prisma.trainingsessions.update({
      where: { SessionID: +id },
      data: {
        Center,
        StartDate,
        EndDate,
        TrainerID: +TrainerID,
        MonitorID: +MonitorID,
        CourseID: +CourseID,
      },
    });

    res.redirect(`/admin/programs/${programId}/courses/${courseId}`);
  } catch (error) {
    console.log("Error updating session:", error);
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

router.post('/programs/:programId/courses/:id/edit', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const { Name } = req.body;

    const updatedCourse = await prisma.course.update({
      where: { CourseID: courseId },
      data: { Name },
    });

    console.log('Updated course:', updatedCourse);
    res.redirect(`/admin/programs/${req.params.programId}/courses`);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(400).json({ error: 'Failed to update course.' });
  }
});


router.get("/program/:programId/course/:courseId/session/:sessionId/participant", async (req, res) => {
  try {
     const sessionId =  +req.params.sessionId;
     const programId =  +req.params.programId;
     const courseId =  +req.params.courseId;
     const data = await prisma.Participant.findMany({
      where: {
        sessionId: sessionId,
        deletedAt: null, // Exclude soft-deleted participants
      }
    });
    

    const sessions = await prisma.trainingsessions.findMany();
    res.render("admin/participants", { participants: data, sessions,programId,courseId,sessionId });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("/participant/bulk", async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const excelFile = req.files.file;
    const workbook = xlsx.read(excelFile.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const participantsData = xlsx.utils.sheet_to_json(sheet);

    let createdCount = 0;
    let skippedCount = 0;

    for (const row of participantsData) {
      if(!row.name || !row.cnic || !row.email || !row.contact || !row.sessionId || !row.program_id) {
        // Save as duplicate with reason
        await prisma.duplicateParticipant.create({
          data: {
            name: row.name || 'N/A',
            cnic: String(row.cnic || 'N/A'),
            email: row.email || 'N/A',
            contact: String(row.contact || 'N/A'),
            sessionId: +row.sessionId,
            program_id: +row.program_id,
            reason: 'Missing required fields'
          }
        });
        skippedCount++;
        continue;
      }
      
      const trimmedEmail = row.email.trim().toLowerCase();
      const existingUsers = await prisma.$queryRaw`SELECT * FROM users WHERE LOWER(Email) = ${trimmedEmail}`;
      const existingUser = existingUsers[0] || null;

      if (existingUser) {
        // Save as duplicate with reason
        await prisma.duplicateParticipant.create({
          data: {
            name: row.name,
            cnic: String(row.cnic),
            email: row.email,
            contact: String(row.contact),
            sessionId: +row.sessionId,
            program_id: +row.program_id,
            reason: 'Email already exists in system'
          }
        });
        skippedCount++;
        continue; 
      }

      const hashedPassword = await hash(String(row.cnic), 10);
      const newUser = await prisma.users.create({
        data: {
          Username: row.name,
          Password: hashedPassword,
          Email: row.email,
          UserType: UserType.STUDENT,
          SessionID: +row.sessionId,
          ProgramID: String(row.program_id),
          
        },
      });

       const participantData = await prisma.participant.create({
        data: {
            name: row.name,
            cnic: String(row.cnic),
            email: row.email,
            contact: String(row.contact),
            sessionId: +row.sessionId,
            program_id: +row.program_id,
        }
      });

      await prisma.users.update({
        where: { UserID: newUser.UserID },
        data: { ParticipantID: participantData.id }
      });

      await prisma.programUsers.create({
        data: {
          UserID: newUser.UserID,
          ProgramID: +row.program_id,
          SessionID: +row.sessionId,
        },
      });

      createdCount++;
    }

    res.status(200).json({ message: `Import complete. ${createdCount} participants imported, ${skippedCount} duplicate entries saved to history.` });
  } catch (error) {
    console.error("Error creating bulk participants:", error);
    res.status(500).json({ error: error.message || "Failed to create participants in bulk." });
  }
});

router.get("/monitors", async (req, res) => {
  try {
    // 1. Get all monitors
    const monitors = await prisma.users.findMany({
      where: { UserType: "MONITOR" },
    });

    // 2. For each monitor, fetch the related program using ProgramID
    const monitorsWithPrograms = await Promise.all(
      monitors.map(async (monitor) => {
        let program = null;

        if (monitor.ProgramID) {
          program = await prisma.programs.findUnique({
            where: { ProgramID: +monitor.ProgramID },
          });
        }

        return {
          ...monitor,
          program, // may be null if not found
        };
      })
    );

    // 3. Render with program info
    res.render("admin/monitors", { monitors: monitorsWithPrograms });
  } catch (error) {
    console.error("Error fetching monitors:", error);
    res.status(500).json({ error: "Failed to fetch monitors." });
  }
});

router.delete("/monitors/:id", async (req, res) => {
  try {
    const id = +req.params.id;
    const deleted = await prisma.users.delete({
      where: { UserID: id },
    });

    res.json({ success: true, message: "Monitor deleted." });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete monitor." });
  }
});

router.get("/monitor/edit/:id", async (req, res) => {
  try {
    const monitorId = +req.params.id;
    
    // Get the monitor with their related program
    const monitor = await prisma.users.findFirst({
      where: {
        UserID: monitorId,
        UserType: "MONITOR"
      },
    });

    if (!monitor) {
      return res.status(404).json({ message: "Monitor not found" });
    }

    // Get all programs for the dropdown
    const programs = await prisma.programs.findMany();

    res.render("admin/editMonitor", { 
      monitor, 
      programs 
    });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(500).json({ error: "Failed to fetch monitor for editing" });
  }
});

router.post("/monitor/update/:id", async (req, res) => {
  try {
    const monitorId = +req.params.id;
    const { Username, Email, FirstName, LastName, ContactNumber, ProgramID } = req.body;

    // Validate required fields
    if (!Username || !Email) {
      return res.status(400).json({ 
        status: false, 
        error: "Missing fields", 
        message: "Username and Email are required" 
      });
    }

    // Check if email already exists for another user
    const existingUser = await prisma.users.findFirst({
      where: {
        Email: Email,
        UserID: { not: monitorId }
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        status: false, 
        error: "Email already exists", 
        message: "This email is already registered to another user" 
      });
    }

    // Update the monitor
    const updatedMonitor = await prisma.users.update({
      where: {
        UserID: monitorId,
      },
      data: {
        Username,
        Email,
        FirstName: FirstName || null,
        LastName: LastName || null,
        ContactNumber: ContactNumber || null,
        ProgramID: ProgramID || null,
      },
    });

    if (!updatedMonitor) {
      return res.status(400).json({ status: false, error: "Failed to update monitor" });
    }

    // Respond with success JSON
    return res.status(200).json({ status: true, message: "Monitor updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || error });
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
router.delete("/center/delete/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.centers.delete({ where: { CenterID: id } });
    res.status(200).json({ message: "Center deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete center" });
  }
});

router.get("/center/edit/:id", async (req, res) => {
  try {
    const centerId = +req.params.id;
    
    // Get the center
    const center = await prisma.centers.findFirst({
      where: {
        CenterID: centerId
      },
    });

    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }

    res.render("admin/editCenter", { 
      center 
    });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(500).json({ error: "Failed to fetch center for editing" });
  }
});

router.post("/center/update/:id", async (req, res) => {
  try {
    const centerId = +req.params.id;
    const { Name, City, FocalPerson, SeatingCapacity, haveComputerLab } = req.body;

    // Validate required fields
    if (!Name || !City || !FocalPerson || !SeatingCapacity || !haveComputerLab) {
      return res.status(400).json({ 
        status: false, 
        error: "Missing fields", 
        message: "All fields are required" 
      });
    }

    // Update the center
    const updatedCenter = await prisma.centers.update({
      where: {
        CenterID: centerId,
      },
      data: {
        Name,
        City,
        FocalPerson,
        SeatingCapacity: +SeatingCapacity,
        haveComputerLab: haveComputerLab === 'true',
      },
    });

    if (!updatedCenter) {
      return res.status(400).json({ status: false, error: "Failed to update center" });
    }

    // Respond with success JSON
    return res.status(200).json({ status: true, message: "Center updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || error });
  }
});

router.get("/trainers", async (req, res) => {
  try {
    let trainers = await prisma.users.findMany({
      where: {
        UserType: UserType.TRAINER,
      },
    });
    // console.log(trainers);

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
      
      // console.log(data)
      allTrainers.push(data);
    }
    for (let i = 0; i < allTrainers.length; i++) {
  const trainer = allTrainers[i];

  if (trainer.ProgramID && !isNaN(+trainer.ProgramID)) {
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: +trainer.ProgramID,
      },
      select: {
        Name: true,
      },
    });

    trainer.programName = program?.Name || undefined;
  }
}



    res.render("admin/trainers", { var_trainers: allTrainers });
  } catch (error) {
    
  }
});

router.get("/trainer/edit/:id", async (req, res) => {
  try {
    const trainerId = +req.params.id;
    
    // Get the trainer with their related program
    const trainer = await prisma.users.findFirst({
      where: {
        UserID: trainerId,
        UserType: "TRAINER"
      },
    });

    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    // Get all programs for the dropdown
    const programs = await prisma.programs.findMany();

    res.render("admin/editTrainer", { 
      trainer, 
      programs 
    });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(500).json({ error: "Failed to fetch trainer for editing" });
  }
});

router.post("/trainer/update/:id", async (req, res) => {
  try {
    const trainerId = +req.params.id;
    const { Username, Email, FirstName, LastName, ContactNumber, ProgramID } = req.body;

    // Validate required fields
    if (!Username || !Email) {
      return res.status(400).json({ 
        status: false, 
        error: "Missing fields", 
        message: "Username and Email are required" 
      });
    }

    // Check if email already exists for another user
    const existingUser = await prisma.users.findFirst({
      where: {
        Email: Email,
        UserID: { not: trainerId }
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        status: false, 
        error: "Email already exists", 
        message: "This email is already registered to another user" 
      });
    }

    // Update the trainer
    const updatedTrainer = await prisma.users.update({
      where: {
        UserID: trainerId,
      },
      data: {
        Username,
        Email,
        FirstName: FirstName || null,
        LastName: LastName || null,
        ContactNumber: ContactNumber || null,
        ProgramID: ProgramID || null,
      },
    });

    if (!updatedTrainer) {
      return res.status(400).json({ status: false, error: "Failed to update trainer" });
    }

    // Respond with success JSON
    return res.status(200).json({ status: true, message: "Trainer updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || error });
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

// router.get("/feedbacks/program/:id", async (req, res) => {
//   try {
//     const id = req.params.id;

    

//     const sessions = await prisma.trainingsessions.findMany({
//       where: {
//         ProgramID: +req.params.id,
        
//       },
//       include: {
//         programs: true,
//         users_trainingsessions_TrainerIDTousers: true,
//         users_trainingsessions_MonitorIDTousers:true
//       },
//     });
//     console.log(`=====================`)
//      console.log(sessions)
//     console.log(`=====================`)


    
    
//     res.render("admin/programFeedback", { id ,sessions});
//   } catch (error) {
//     console.log("🚀 ~ router.get ~ error:", error);
//   }
// });


router.get("/feedbacks/program/:id", async (req, res) => {
  try {
    const programId = +req.params.id;

    // Fetch all sessions for the given program
    const sessions = await prisma.trainingsessions.findMany({
      where: {
        ProgramID: programId,
      },
      include: {
        programs: true,
        users_trainingsessions_TrainerIDTousers: true,
        users_trainingsessions_MonitorIDTousers: true,
      },
    });

    // Fetch all feedbacks for those sessions
    const feedbacks = await prisma.feedback.findMany({
      where: {
        ProgramID: programId,
      },
      select: {
        SessionID: true,
      },
    });

    // Create a Set of session IDs that have feedback
    const feedbackSessionIds = new Set(feedbacks.map(fb => fb.SessionID));

    // Add uploaded_status to each session
    const enrichedSessions = sessions.map(session => ({
      ...session,
      uploaded_status: feedbackSessionIds.has(session.SessionID),
    }));
    console.log(enrichedSessions);

    res.render("admin/programFeedback", { id: programId, sessions: enrichedSessions });

  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(500).send("Internal Server Error");
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

router.post("/user/create", async (req, res) => {
  try {
    const { Email, Password, Username, UserType, ProgramID } = req.body;
    
    // Validate required fields
    if (!Email || !Password || !Username || !UserType) {
      return res.status(400).json({
        success: false,
        message: "Email, Password, Username, and UserType are required"
      });
    }

    // Check if email already exists
    const existingUser = await prisma.users.findFirst({
      where: { Email: Email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Hash password
    const hashedPassword = await hash(Password, 10);

    // Create user data
    const userData = {
      Email: Email.toLowerCase(),
      Password: hashedPassword,
      Username,
      UserType
    };

    // Add ProgramID for trainers
    if (UserType === 'TRAINER' && ProgramID) {
      userData.ProgramID = ProgramID;
    }

    // Handle profile picture upload
    if (req.files && req.files.ProfilePicture) {
      const file = req.files.ProfilePicture;
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `/uploads/profiles/${fileName}`;
      
      await file.mv(`./public${filePath}`);
      userData.ProfilePicture = filePath;
    }

    // Create user
    const newUser = await prisma.users.create({
      data: userData
    });

    res.json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser.UserID,
        email: newUser.Email,
        username: newUser.Username,
        userType: newUser.UserType
      }
    });

  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

router.post("/user/bulk", async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No files were uploaded.' 
      });
    }

    const excelFile = req.files.file;
    const workbook = xlsx.read(excelFile.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const usersData = xlsx.utils.sheet_to_json(sheet);

    let createdCount = 0;
    let skippedCount = 0;
    let errors = [];

    for (let i = 0; i < usersData.length; i++) {
      const row = usersData[i];
      
      try {
        // Validate required fields
        if (!row.email || !row.password || !row.username || !row.usertype) {
          errors.push(`Row ${i + 2}: Missing required fields (email, password, username, usertype)`);
          skippedCount++;
          continue;
        }

        const email = row.email.trim().toLowerCase();
        const password = row.password;
        const username = row.username.trim();
        const userType = row.usertype.toUpperCase();
        const programId = row.program_id ? String(row.program_id) : null;

        // Validate user type
        const validUserTypes = ['TRAINER', 'ADMIN', 'STUDENT', 'MONITOR', 'MANAGER'];
        if (!validUserTypes.includes(userType)) {
          errors.push(`Row ${i + 2}: Invalid user type '${userType}'`);
          skippedCount++;
          continue;
        }

        // Check if email already exists
        const existingUser = await prisma.users.findFirst({
          where: { Email: email }
        });

        if (existingUser) {
          errors.push(`Row ${i + 2}: Email '${email}' already exists`);
          skippedCount++;
          continue;
        }

        // Hash password
        const hashedPassword = await hash(password, 10);

        // Create user data
        const userData = {
          Email: email,
          Password: hashedPassword,
          Username: username,
          UserType: userType
        };

        // Add ProgramID for trainers
        if (userType === 'TRAINER' && programId) {
          // Validate program exists
          const program = await prisma.programs.findUnique({
            where: { ProgramID: parseInt(programId) }
          });
          
          if (!program) {
            errors.push(`Row ${i + 2}: Program ID '${programId}' not found`);
            skippedCount++;
            continue;
          }
          
          userData.ProgramID = programId;
        }

        // Create user
        await prisma.users.create({
          data: userData
        });

        createdCount++;

      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
        skippedCount++;
      }
    }

    let message = `Import complete. ${createdCount} users created, ${skippedCount} skipped.`;
    if (errors.length > 0) {
      message += `\n\nErrors:\n${errors.slice(0, 10).join('\n')}`;
      if (errors.length > 10) {
        message += `\n... and ${errors.length - 10} more errors`;
      }
    }

    res.json({
      success: true,
      message: message,
      createdCount,
      skippedCount,
      errors: errors.slice(0, 10) // Return first 10 errors
    });

  } catch (error) {
    console.error("Error creating bulk users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process bulk user upload",
      error: error.message
    });
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

router.get("/program/edit/:id", async (req, res) => {
  try {
    const programId = +req.params.id;
    
    // Get the program with its related data
    const program = await prisma.programs.findFirst({
      where: {
        ProgramID: programId,
      },
      include: {
        Documents: {
          include: {
            documentType: true,
          },
        },
      },
    });

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    const donors = await prisma.thirdparties.findMany();
    const managers = await prisma.users.findMany({
      where: {
        UserType: UserType.MANAGER
      }
    });
    const documentType = await prisma.documentType.findMany();

    // Format dates for input fields
    const formatDate = (date) => {
      const d = new Date(date);
      const month = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      return [d.getFullYear(), month, day].join('-');
    };

    program.Startdate = formatDate(program.Startdate);
    program.EndDate = formatDate(program.EndDate);

    // Get selected document type IDs
    const selectedDocumentTypes = program.Documents.map(doc => doc.documentType.DocumentTypeID);

    // Get manager username if ManagerID exists
    let managerUsername = null;
    if (program.ManagerID) {
      const managerUser = await prisma.users.findFirst({
        where: {
          UserID: program.ManagerID,
          UserType: UserType.MANAGER
        }
      });
      managerUsername = managerUser?.Username || null;
    }
    // If no manager is assigned, managerUsername will remain null, which is fine for the template

    res.render("admin/editProgram", { 
      program, 
      donors, 
      managers, 
      documentType,
      selectedDocumentTypes,
      managerUsername
    });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(500).json({ error: "Failed to fetch program for editing" });
  }
});

router.post("/program/create", async (req, res) => {
  const { Name, StartDate, EndDate, DonorOrganization, Description, Category, Manager, documentTypes } = req.body;
  console.log(documentTypes);

  if (!documentTypes || documentTypes.length < 1) {
    return res.status(400).json({
      status: false,
      error: "Missing fields",
      message: "Create / select  at least 1 Document"
    });
  }

  try {
    if (!Name || !EndDate || !StartDate || !DonorOrganization || !Description || !Category) {
      return res.status(400).json({ status: false, error: "Missing fields", message: "Missing fields" });
    }

    const startDate = new Date(StartDate).toLocaleDateString();
    const endDate = new Date(EndDate).toLocaleDateString();

    // Find manager user ID if manager username is provided
    let managerId = null;
    if (Manager) {
      const managerUser = await prisma.users.findFirst({
        where: {
          Username: Manager,
          UserType: UserType.MANAGER
        }
      });
      managerId = managerUser?.UserID || null;
    }

    const data = await prisma.programs.create({
      data: {
        Name,
        EndDate: endDate,
        Startdate: startDate,
        DonorOrganizationID: +DonorOrganization,
        Description,
        Category,
        ManagerID: managerId,
        Documents: {
          create: documentTypes.map((documentTypeId) => ({
            documentType: { connect: { DocumentTypeID: +documentTypeId } },
          })),
        },
      },
    });

    if (!data) {
      return res.status(400).json({ status: false, error: "Failed to create program" });
    }

    // Respond with success JSON instead of redirect
    return res.status(201).json({ status: true, message: "Program created successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || error });
  }
});

router.post("/program/update/:id", async (req, res) => {
  const { Name, StartDate, EndDate, DonorOrganization, Description, Category, Manager, documentTypes } = req.body;
  const programId = +req.params.id;

  if (!documentTypes || documentTypes.length < 1) {
    return res.status(400).json({
      status: false,
      error: "Missing fields",
      message: "Create / select at least 1 Document"
    });
  }

  try {
    if (!Name || !EndDate || !StartDate || !DonorOrganization || !Description || !Category) {
      return res.status(400).json({ status: false, error: "Missing fields", message: "Missing fields" });
    }

    const startDate = new Date(StartDate).toLocaleDateString();
    const endDate = new Date(EndDate).toLocaleDateString();

    // Find manager user ID if manager username is provided
    let managerId = null;
    if (Manager) {
      const managerUser = await prisma.users.findFirst({
        where: {
          Username: Manager,
          UserType: UserType.MANAGER
        }
      });
      managerId = managerUser?.UserID || null;
    }

    // First, delete existing document associations
    await prisma.documentTypeProgram.deleteMany({
      where: {
        ProgramID: programId,
      },
    });

    // Update the program
    const updatedProgram = await prisma.programs.update({
      where: {
        ProgramID: programId,
      },
      data: {
        Name,
        EndDate: endDate,
        Startdate: startDate,
        DonorOrganizationID: +DonorOrganization,
        Description,
        Category,
        ManagerID: managerId,
        Documents: {
          create: documentTypes.map((documentTypeId) => ({
            documentType: { connect: { DocumentTypeID: +documentTypeId } },
          })),
        },
      },
    });

    if (!updatedProgram) {
      return res.status(400).json({ status: false, error: "Failed to update program" });
    }

    // Respond with success JSON instead of redirect
    return res.status(200).json({ status: true, message: "Program updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || error });
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
    // console.log(programs)
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
  // console.log(file)
  const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
  

  
  
  console.log("form data: ", req.body)
try {
  if (!name || !ProgramID || !SessionID || !file) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Define the reports directory relative to the project root
  // const reportsDir = path.join(__dirname, '../../public/uploads/reports');
  const baseDir = path.join(__dirname, '../../public');
    const reportsDir = path.join(baseDir, '/uploads/reports');

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

    // console.log("File saved to:", filePath);
    

    // Redirect after successful file upload
    // res.redirect("/admin/reports");
  });
  let FilePath = path.relative(baseDir, filePath);
  if (!FilePath.startsWith('\\')) {
    FilePath = `\\${FilePath}`;
  }
  console.log(FilePath)
    try{
      const report = await prisma.report.create({
        data: {
          Name: name,
          ProgramID: parseInt(ProgramID),
          SessionID: parseInt(SessionID),
          FilePath: FilePath,
          isForTrainer: isTrainer ==='true' ? true:false,
          isForMonitor: isMonitor ==='true' ?true:false,
        }
      })

    }catch(err){

    }
res.redirect("/admin/reports");
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({ error });
}
});



router.get("/allReports", async (req, res) => {
  try {
    
    const allReports = await prisma.report.findMany();

    // Add a new property to each report to indicate the target role
    const reportsWithRole = allReports.map(report => {
      if (report.isForMonitor) {
        report.targetRole = "monitor";
      } else if (report.isForTrainer) {
        report.targetRole = "trainer";
      }
      return report;
    });

    const submittedReports = await prisma.submitedReport.findMany({
      include: {
        report: true, // Assuming 'report' is the related model
        users: true,  // Assuming 'users' is the related model
      },
    });
    const submittedRole = submittedReports.map(submittedReport => {
      if (submittedReport.report.isForMonitor) {
        submittedReport.submitRole = "monitor";
      } else if (submittedReport.report.isForTrainer) {
        submittedReport.submitRole = "trainer";
      } else {
        submittedReport.submitRole = "Unknown";
      }
      return submittedReport;
    });
    // res.json(submittedReports);
    res.render("admin/allReports", { allReports: reportsWithRole, submittedReports: submittedRole});
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

router.delete("/allReports/:id", async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    await prisma.report.delete({ where: { ReportID: reportId } });
    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ message: "Failed to delete report" });
  }
});
router.delete("/submittedReports/:id", async (req, res) => {
  try {
    const submittedId = parseInt(req.params.id);
    await prisma.submitedReport.delete({ where: { SubmitedReportID: submittedId } });
    res.status(200).json({ message: "Submitted report deleted successfully" });
  } catch (error) {
    console.error("Error deleting submitted report:", error);
    res.status(500).json({ message: "Failed to delete submitted report" });
  }
});

// Edit routes for reports
router.get("/report/edit/:id", async (req, res) => {
  try {
    const reportId = +req.params.id;
    
    // Get the report
    const report = await prisma.report.findFirst({
      where: {
        ReportID: reportId
      },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Get all programs with their training sessions
    const programs = await prisma.programs.findMany({
      include: {
        trainingsessions: true,
      },
    });

    res.render("admin/editReport", { 
      report,
      programs
    });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(500).json({ error: "Failed to fetch report for editing" });
  }
});

router.post("/report/update/:id", async (req, res) => {
  try {
    const reportId = +req.params.id;
    const { name, ProgramID, SessionID, targetRole } = req.body;
    const file = req.files?.template;

    // Validate required fields
    if (!name || !ProgramID || !SessionID) {
      return res.status(400).json({ 
        status: false, 
        error: "Missing fields", 
        message: "Name, Program ID, and Session ID are required" 
      });
    }

    // Get the existing report
    const existingReport = await prisma.report.findFirst({
      where: {
        ReportID: reportId
      },
    });

    if (!existingReport) {
      return res.status(404).json({ 
        status: false, 
        error: "Report not found" 
      });
    }

    let filePath = existingReport.FilePath; // Keep existing file if no new file uploaded

    // If a new file is uploaded, save it and update the file path
    if (file) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const baseDir = path.join(__dirname, '../../public');
      const reportsDir = path.join(baseDir, '/uploads/reports');

      // Ensure the directory exists
      fs.ensureDirSync(reportsDir);

      // Delete the old file if it exists
      if (existingReport.FilePath) {
        const oldFilePath = path.join(baseDir, existingReport.FilePath.replace(/\\/g, '/'));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Save new file
      const newFilePath = path.join(reportsDir, file.name);
      await file.mv(newFilePath);
      
      filePath = path.relative(baseDir, newFilePath);
      if (!filePath.startsWith('\\')) {
        filePath = `\\${filePath}`;
      }
    }

    // Update the report
    const updatedReport = await prisma.report.update({
      where: {
        ReportID: reportId,
      },
      data: {
        Name: name,
        ProgramID: parseInt(ProgramID),
        SessionID: parseInt(SessionID),
        FilePath: filePath,
        isForTrainer: targetRole === 'trainer' ? true : false,
        isForMonitor: targetRole === 'monitor' ? true : false,
      },
    });

    if (!updatedReport) {
      return res.status(400).json({ status: false, error: "Failed to update report" });
    }

    // Respond with success JSON
    return res.status(200).json({ status: true, message: "Report updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || error });
  }
});

// Edit routes for submitted reports
router.get("/submittedReport/edit/:id", async (req, res) => {
  try {
    const submittedReportId = +req.params.id;
    
    // Get the submitted report with related data
    const submittedReport = await prisma.submitedReport.findFirst({
      where: {
        SubmitedReportID: submittedReportId
      },
      include: {
        report: true,
        users: true,
      },
    });

    if (!submittedReport) {
      return res.status(404).json({ message: "Submitted report not found" });
    }

    res.render("admin/editSubmittedReport", { 
      submittedReport 
    });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(500).json({ error: "Failed to fetch submitted report for editing" });
  }
});

router.post("/submittedReport/update/:id", async (req, res) => {
  try {
    const submittedReportId = +req.params.id;
    const { UserID, ReportID } = req.body;
    const file = req.files?.file;

    // Validate required fields
    if (!UserID || !ReportID) {
      return res.status(400).json({ 
        status: false, 
        error: "Missing fields", 
        message: "User ID and Report ID are required" 
      });
    }

    // Get the existing submitted report
    const existingSubmittedReport = await prisma.submitedReport.findFirst({
      where: {
        SubmitedReportID: submittedReportId
      },
    });

    if (!existingSubmittedReport) {
      return res.status(404).json({ 
        status: false, 
        error: "Submitted report not found" 
      });
    }

    let filePath = existingSubmittedReport.FilePath; // Keep existing file if no new file uploaded

    // If a new file is uploaded, save it and update the file path
    if (file) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const baseDir = path.join(__dirname, '../../public');
      const reportsDir = path.join(baseDir, '/uploads/reports');

      // Ensure the directory exists
      fs.ensureDirSync(reportsDir);

      // Delete the old file if it exists
      if (existingSubmittedReport.FilePath) {
        const oldFilePath = path.join(baseDir, existingSubmittedReport.FilePath.replace(/\\/g, '/'));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Save new file
      const newFilePath = path.join(reportsDir, file.name);
      await file.mv(newFilePath);
      
      filePath = path.relative(baseDir, newFilePath);
      if (!filePath.startsWith('\\')) {
        filePath = `\\${filePath}`;
      }
    }

    // Update the submitted report
    const updatedSubmittedReport = await prisma.submitedReport.update({
      where: {
        SubmitedReportID: submittedReportId,
      },
      data: {
        UserID: parseInt(UserID),
        ReportID: parseInt(ReportID),
        FilePath: filePath,
      },
    });

    if (!updatedSubmittedReport) {
      return res.status(400).json({ status: false, error: "Failed to update submitted report" });
    }

    // Respond with success JSON
    return res.status(200).json({ status: true, message: "Submitted report updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || error });
  }
});


// router.delete("/allReports/:id", async (req, res) => {
//   const reportId = parseInt(req.params.id, 10);
//   console.log(`Received delete request for report ID: ${reportId}`);
//   try {
//     await prisma.report.delete({
//       where: {
//         id: reportId,
//       },
//     });
//     res.status(200).json({ message: "Report deleted successfully" });
//   } catch (error) {
//     console.log("🚀 ~ router.delete ~ error:", error);
//     res.status(500).json({ error: "An error occurred while deleting the report." });
//   }
// });








// all reports of a program
// router.get("/reports/:id", async (req, res) => {
//   try {
//     const id = +req.params.id; // Convert to number

//     // Use `findFirst` to find a single record
//     const program = await prisma.programs.findFirst({
//       where: {
//         ProgramID: id,
//       },
//     });

    

//     if (!program) {
//       throw new Error(`Program with ID ${id} not found`);
//     }

//     const reports = await prisma.report.findMany({
//       where: {
//         ProgramID: +id,
//       },
//       include: {
//         SubmitedReports: true,
//       },
//     });

//     res.render("admin/programReports", { program, reports });
//   } catch (error) {
//     console.error("🚀 ~ router.get ~ error:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// // single report
// router.get("/report/:id", async (req, res) => {
//   try {
//     const id = +req.params.id; // Convert to number
//     const report = await prisma.submitedReport.findMany({
//       where: {
//         ReportID: +id,
//       },
//       include: {
//         report: true,
//       },
//     });

//     const mainReport = await prisma.report.findFirst({
//       where: {
//         ReportID: +id,
//       },
//     });
    

//     if (!report) {
//       throw new Error(`Program with ID ${id} not found`);
//     }

//     res.render("admin/singleReport", {
//       report,
//       mainReport,
//     });
//   } catch (error) {
//     console.error("🚀 ~ router.get ~ error:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// router.get("/reports/:id/create", async (req, res) => {
//   try {
//     const program = await prisma.programs.findFirst({
//       where: {
//         ProgramID: +req.params.id,
//       },
//     });

//     // res.json(program);
//     res.render("admin/createReport", { program });
//   } catch (error) {
//     console.log("🚀 ~ router.get ~ error:", error);
//   }
// });

export default router;

// ==================== BACKUP ROUTES ====================

// Get all backups
router.get("/backups", async (req, res) => {
  try {
    const backups = await prisma.backup.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.render("admin/backups", { backups });
  } catch (error) {
    console.error("Error fetching backups:", error);
    res.status(500).json({ error: "Failed to fetch backups" });
  }
});

// Generate new backup
router.post("/backups/generate", async (req, res) => {
  try {
    const { description } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;
    
    // Create backup directory inside uploads
    const backupDir = path.join(process.cwd(), 'public', 'uploads', 'db_backup');
    await fs.ensureDir(backupDir);

    // Create a proper database backup with all data
    const databaseUrl = process.env.DATABASE_URL || '';
    const url = new URL(databaseUrl);
    const dbName = (url.pathname || '').replace(/^\//, '');
    const sqlFilePath = path.join(backupDir, `${backupName}.sql`);
    
    // Try to use mysqldump if available, otherwise use mysql2 to generate backup
    try {
      // First try mysqldump command
      const mysqldumpCommand = `mysqldump -h ${url.hostname} -P ${url.port || 3306} -u ${decodeURIComponent(url.username || '')} -p${decodeURIComponent(url.password || '')} ${dbName} > "${sqlFilePath}"`;
      
      try {
        await execAsync(mysqldumpCommand);
        console.log('Database backup created using mysqldump');
      } catch (mysqldumpError) {
        console.log('mysqldump not available, using mysql2 to generate backup');
        
        // Fallback: Use mysql2 to generate backup manually
        const mysql = await import('mysql2/promise');
        const dbConfig = {
          host: url.hostname,
          port: url.port ? parseInt(url.port) : 3306,
          user: decodeURIComponent(url.username || ''),
          password: decodeURIComponent(url.password || ''),
          database: dbName,
          multipleStatements: true,
        };

        const connection = await mysql.createConnection(dbConfig);
        
        try {
          // Get all table names
          const [tables] = await connection.query('SHOW TABLES');
          const tableNames = tables.map(row => Object.values(row)[0]);
          
                     let backupContent = `-- Database Backup Generated on ${new Date().toISOString()}
-- Database: ${dbName}
-- Backup Type: Full System Backup
-- Generated by: TMS Backup System

-- Backup Metadata:
-- Timestamp: ${new Date().toISOString()}
-- Description: ${description ? description.replace(/'/g, "''") : 'System backup'}

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

`;

          // For each table, get structure and data
          for (const tableName of tableNames) {
            // Get table structure
            const [createTable] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
            const createStatement = createTable[0]['Create Table'];
            
            backupContent += `\n-- Table structure for table \`${tableName}\`\n`;
            backupContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            backupContent += `${createStatement};\n\n`;
            
            // Get table data
            const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
            
            if (rows.length > 0) {
              backupContent += `-- Dumping data for table \`${tableName}\`\n`;
              
              // Get column names
              const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
              const columnNames = columns.map(col => col.Field);
              
                             // Insert data
               for (const row of rows) {
                 const values = columnNames.map(col => {
                   const value = row[col];
                   if (value === null || value === undefined) {
                     return 'NULL';
                   } else if (typeof value === 'string') {
                     // Properly escape strings for SQL
                     return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}'`;
                   } else if (typeof value === 'boolean') {
                     return value ? '1' : '0';
                   } else if (typeof value === 'number') {
                     return value.toString();
                   } else if (value instanceof Date) {
                     return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                   } else {
                     return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
                   }
                 });
                 
                 backupContent += `INSERT INTO \`${tableName}\` (\`${columnNames.join('`, `')}\`) VALUES (${values.join(', ')});\n`;
               }
              backupContent += '\n';
            }
          }
          
          backupContent += `SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
`;

          await fs.writeFile(sqlFilePath, backupContent);
          console.log('Database backup created using mysql2');
        } finally {
          await connection.end();
        }
      }
    } catch (error) {
      console.error('Error creating database backup:', error);
      throw new Error('Failed to create database backup');
    }

    // Create zip archive
    const zipPath = path.join(backupDir, `${backupName}.zip`);
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', async () => {
      try {
        // Get file stats
        const stats = await fs.stat(zipPath);
        
        // Save backup record to database
        const backup = await prisma.backup.create({
          data: {
            filename: `${backupName}.zip`,
            filepath: `/uploads/db_backup/${backupName}.zip`,
            filesize: BigInt(stats.size),
            description: description || `Backup generated on ${new Date().toLocaleString()}`,
            createdBy: 'Admin',
            status: 'completed'
          }
        });

        // Clean up SQL file
        await fs.remove(sqlFilePath);

        res.status(201).json({ 
          success: true, 
          message: "Backup generated successfully",
          backup: {
            id: backup.id,
            filename: backup.filename,
            filesize: stats.size
          }
        });
      } catch (error) {
        console.error("Error saving backup record:", error);
        res.status(500).json({ error: "Failed to save backup record" });
      }
    });

    archive.on('error', (err) => {
      console.error("Archive error:", err);
      res.status(500).json({ error: "Failed to create backup archive" });
    });

    archive.pipe(output);

    // Add SQL file to archive
    archive.file(sqlFilePath, { name: `${backupName}.sql` });

    // Add specific folders to archive (EXCLUDE db_backup to prevent recursion)
    const publicPath = path.join(process.cwd(), 'public');
    
    // Add all folders inside public/uploads (EXCLUDE db_backup to prevent recursion)
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
    
    // Check if uploads directory exists
    if (await fs.pathExists(uploadsPath)) {
      // Get all directories in uploads folder
      const uploadsContents = await fs.readdir(uploadsPath, { withFileTypes: true });
      
      for (const item of uploadsContents) {
        if (item.isDirectory() && item.name !== 'db_backup') {
          const itemPath = path.join(uploadsPath, item.name);
          
          // Add directory to archive
          archive.directory(itemPath, `uploads/${item.name}`);
          console.log(`Added directory to backup: uploads/${item.name}`);
        } else if (item.isFile()) {
          // Add individual files in uploads root (if any)
          const filePath = path.join(uploadsPath, item.name);
          archive.file(filePath, { name: `uploads/${item.name}` });
          console.log(`Added file to backup: uploads/${item.name}`);
        }
      }
    } else {
      console.log('Uploads directory does not exist');
    }

    await archive.finalize();

  } catch (error) {
    console.error("Backup generation error:", error);
    res.status(500).json({ error: "Failed to generate backup" });
  }
});

// Download backup
router.get("/backups/:id/download", async (req, res) => {
  try {
    const backup = await prisma.backup.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!backup) {
      return res.status(404).json({ error: "Backup not found" });
    }

    const filePath = path.join(process.cwd(), 'public', backup.filepath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Backup file not found" });
    }

    res.download(filePath, backup.filename);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to download backup" });
  }
});

// Upload and restore backup
router.post("/backups/upload", async (req, res) => {
  try {
    const backupFile = req.files?.backupFile;
    if (!backupFile) {
      return res.status(400).json({ error: "No backup file uploaded" });
    }

    const { description } = req.body;
    const uploadedFile = backupFile;
    
    // No file size limit - removed size validation
    
    // Validate file type
    if (!uploadedFile.name.toLowerCase().endsWith('.zip')) {
      // Clean up uploaded file
      return res.status(400).json({ error: "Only ZIP files are allowed" });
    }

    // Step 1: Delete public/uploads folder first with retry mechanism
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
    if (await fs.pathExists(uploadsPath)) {
      try {
        await fs.remove(uploadsPath);
        console.log('Deleted existing public/uploads folder');
      } catch (removeError) {
        console.log('Failed to remove uploads folder, trying alternative approach:', removeError.message);
        
        // Alternative approach: Remove files individually first, then directory
        try {
          const removeFilesRecursively = async (dirPath) => {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dirPath, entry.name);
              if (entry.isDirectory()) {
                await removeFilesRecursively(fullPath);
                await fs.rmdir(fullPath);
              } else {
                await fs.unlink(fullPath);
              }
            }
          };
          
          await removeFilesRecursively(uploadsPath);
          await fs.rmdir(uploadsPath);
          console.log('Deleted existing public/uploads folder using alternative method');
        } catch (altError) {
          console.log('Alternative removal also failed, continuing with existing folder:', altError.message);
          // Continue with existing folder - files will be overwritten
        }
      }
    }

    // Step 2: Create temporary directory and extract ZIP
    const tempDir = path.join(process.cwd(), 'temp_backup_restore');
    await fs.ensureDir(tempDir);
    const tempZipPath = path.join(tempDir, 'uploaded_backup.zip');
    await uploadedFile.mv(tempZipPath);

    try {
      // Extract ZIP file
      await extract(tempZipPath, { dir: tempDir });

      // Helper: find first path by predicate recursively
      const findPathRecursive = async (startDir, predicate) => {
        const entries = await fs.readdir(startDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(startDir, entry.name);
          if (await predicate(entry, fullPath)) return fullPath;
        }
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const nested = await findPathRecursive(path.join(startDir, entry.name), predicate);
            if (nested) return nested;
          }
        }
        return null;
      };

      // Locate SQL file and uploads folder
      const sqlFilePath = await findPathRecursive(tempDir, async (entry, fullPath) => entry.isFile() && entry.name.toLowerCase().endsWith('.sql'));
      const backupUploadsPath = await findPathRecursive(tempDir, async (entry, fullPath) => entry.isDirectory() && entry.name === 'uploads');

      if (!sqlFilePath) {
        throw new Error("Backup must contain at least one SQL file");
      }

      if (!backupUploadsPath) {
        throw new Error("Backup must contain an 'uploads' folder");
      }

      // Step 3: Copy the extracted uploads folder to public/uploads with retry mechanism
      console.log(`Copying from: ${backupUploadsPath}`);
      console.log(`Copying to: ${uploadsPath}`);
      
      // Ensure the destination directory exists
      await fs.ensureDir(uploadsPath);
      
      // Copy all contents from the extracted uploads folder with retry logic
      const extractedContents = await fs.readdir(backupUploadsPath);
      console.log('Extracted uploads contents:', extractedContents);
      
      for (const item of extractedContents) {
        const sourcePath = path.join(backupUploadsPath, item);
        const destPath = path.join(uploadsPath, item);
        
        try {
          await fs.copy(sourcePath, destPath);
          console.log(`Copied: ${item}`);
        } catch (copyError) {
          console.log(`Failed to copy ${item}, trying alternative method:`, copyError.message);
          
          // Alternative: Copy file by file for directories
          try {
            const copyRecursively = async (src, dest) => {
              const stat = await fs.stat(src);
              if (stat.isDirectory()) {
                await fs.ensureDir(dest);
                const entries = await fs.readdir(src);
                for (const entry of entries) {
                  await copyRecursively(path.join(src, entry), path.join(dest, entry));
                }
              } else {
                await fs.copy(src, dest);
              }
            };
            
            await copyRecursively(sourcePath, destPath);
            console.log(`Copied ${item} using alternative method`);
          } catch (altCopyError) {
            console.log(`Failed to copy ${item} with alternative method:`, altCopyError.message);
            throw new Error(`Failed to copy ${item}: ${altCopyError.message}`);
          }
        }
      }
      
      console.log('Uploads folder copied successfully');

      // Step 4: Empty all tables in the database
      const mysql = await import('mysql2/promise');
      const databaseUrl = process.env.DATABASE_URL || '';
      const url = new URL(databaseUrl);
      const dbConfig = {
        host: url.hostname,
        port: url.port ? parseInt(url.port) : 3306,
        user: decodeURIComponent(url.username || ''),
        password: decodeURIComponent(url.password || ''),
        database: (url.pathname || '').replace(/^\//, ''),
        multipleStatements: true,
      };

      const connection = await mysql.createConnection(dbConfig);
      try {
        // Get all table names
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(row => Object.values(row)[0]);

        // Empty all tables
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const tableName of tableNames) {
          await connection.query(`TRUNCATE TABLE \`${tableName}\``);
          console.log(`Emptied table: ${tableName}`);
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('All tables emptied successfully');

        // Step 5: Execute the SQL file
        const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
        console.log(`SQL file path: ${sqlFilePath}`);
        console.log(`SQL content length: ${sqlContent.length} characters`);
        console.log('First 500 characters of SQL:', sqlContent.substring(0, 500));
        
        await connection.query(sqlContent);
        console.log('SQL file executed successfully');
      } finally {
        await connection.end();
      }

      // Delete the uploaded ZIP file after successful restoration
      await fs.remove(tempZipPath);
      console.log('Deleted uploaded ZIP file after successful restoration');

      // Clean up temporary directory
      await fs.remove(tempDir);

      res.status(201).json({ 
        success: true, 
        message: "Backup uploaded and restored successfully"
      });

    } catch (extractError) {
      // Clean up on error
      if (await fs.pathExists(tempZipPath)) {
        await fs.remove(tempZipPath);
      }
      if (await fs.pathExists(tempDir)) {
        await fs.remove(tempDir);
      }
      throw extractError;
    }

  } catch (error) {
    console.error("Backup upload error:", error);
    res.status(500).json({ error: error.message || "Failed to upload and restore backup" });
  }
});

// Delete backup
router.delete("/backups/:id", async (req, res) => {
  try {
    const backup = await prisma.backup.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!backup) {
      return res.status(404).json({ error: "Backup not found" });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'public', backup.filepath);
    if (fs.existsSync(filePath)) {
      await fs.remove(filePath);
    }

    // Delete record from database
    await prisma.backup.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ success: true, message: "Backup deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete backup" });
  }
});

// ==================== USER MANAGEMENT ROUTES ====================

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      orderBy: {
        UserID: 'desc'
      }
    });

    // Get program names for users with ProgramID
    const usersWithPrograms = await Promise.all(
      users.map(async (user) => {
        let programName = null;
        
        if (user.ProgramID && !isNaN(+user.ProgramID)) {
          const program = await prisma.programs.findUnique({
            where: { ProgramID: parseInt(user.ProgramID) },
            select: { Name: true }
          });
          programName = program?.Name;
        }

        return {
          ...user,
          programName
        };
      })
    );

    const programs = await prisma.programs.findMany();

    res.render("admin/users", { 
      users: usersWithPrograms,
      programs 
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get single user
router.get("/user/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await prisma.users.findUnique({
      where: { UserID: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get program name if user has ProgramID
    let programName = null;
    if (user.ProgramID && !isNaN(+user.ProgramID)) {
      const program = await prisma.programs.findUnique({
        where: { ProgramID: parseInt(user.ProgramID) },
        select: { Name: true }
      });
      programName = program?.Name;
    }

    res.json({
      success: true,
      user: {
        ...user,
        programName
      }
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Update user
router.post("/user/:id/update", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { Username, Email, FirstName, LastName, ContactNumber, UserType, ProgramID } = req.body;

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { UserID: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if email is already taken by another user
    if (Email && Email !== existingUser.Email) {
      const emailExists = await prisma.users.findFirst({
        where: { 
          Email: Email.toLowerCase(),
          UserID: { not: userId }
        }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken by another user"
        });
      }
    }

    // Prepare update data
    const updateData = {
      Username: Username || existingUser.Username,
      Email: Email ? Email.toLowerCase() : existingUser.Email,
      FirstName: FirstName || existingUser.FirstName,
      LastName: LastName || existingUser.LastName,
      ContactNumber: ContactNumber || existingUser.ContactNumber,
      UserType: UserType || existingUser.UserType
    };

    // Handle ProgramID for trainers
    if (UserType === 'TRAINER' && ProgramID) {
      updateData.ProgramID = ProgramID;
    } else if (UserType !== 'TRAINER') {
      updateData.ProgramID = null;
    }

    // Handle profile picture upload
    if (req.files && req.files.ProfilePicture) {
      const file = req.files.ProfilePicture;
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `/uploads/profiles/${fileName}`;
      
      await file.mv(`./public${filePath}`);
      updateData.ProfilePicture = filePath;
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { UserID: userId },
      data: updateData
    });

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: updatedUser.UserID,
        email: updatedUser.Email,
        username: updatedUser.Username,
        userType: updatedUser.UserType
      }
    });

  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Delete user
router.delete("/user/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { UserID: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is the last admin (prevent deleting all admins)
    if (user.UserType === 'ADMIN') {
      const adminCount = await prisma.users.count({
        where: { UserType: 'ADMIN' }
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last admin user"
        });
      }
    }

    // Delete user's profile picture if exists
    if (user.ProfilePicture) {
      const filePath = `./public${user.ProfilePicture}`;
      if (fs.existsSync(filePath)) {
        await fs.remove(filePath);
      }
    }

    // Delete user
    await prisma.users.delete({
      where: { UserID: userId }
    });

    res.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Bulk user creation page
router.get("/user/bulk", async (req, res) => {
  try {
    res.render("admin/createUser", { 
      programs: [],
      showBulkOnly: true 
    });
  } catch (error) {
    console.error("Error loading bulk user page:", error);
    res.status(500).json({ error: "Failed to load bulk user page" });
  }
});
