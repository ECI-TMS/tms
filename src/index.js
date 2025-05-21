import dotenv from "dotenv";
import express from "express";
import fileUpload from "express-fileupload";
import hbs from "express-hbs";
import fs from "fs";
import handlebarsEqual from "handlebars-helper-equal";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

import { hash } from "bcrypt";
import cookieParser from "cookie-parser";
import prisma from "./lib/db.js";
import adminRouter from "./routes/adminRouter.js";
import managerRouter from "./routes/managerRouter.js";
import monitorRouter from "./routes/monitorRouter.js";
import participantRouter from "./routes/participants.js";
import programRouter from "./routes/program.js";
import sessionRouter from "./routes/session.js";
import studentRouter from "./routes/studentRouter.js";
import trainerRouter from "./routes/trainerRouter.js";
import uploadRouter from "./routes/uploadData.js";
import userRouter from "./routes/userRouter.js";
import exphbs from   "express-handlebars";
import { hbsHelpers } from './helpers/handlebar.js';

import authMiddleware from "./middlewares/authmiddleware.js";

// let today = new Date();
// let dayOfWeek = today.getDay();

// // Restrict access on a specific day (e.g., Monday)
// if (dayOfWeek !== 5 && dayOfWeek !== 6 && dayOfWeek !== 0 && dayOfWeek !== 1) {
//   throw new Error("Server is not responding. Please contact your developer");
// }

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicPath = resolve(__dirname, "views");

dotenv.config({
  path: "../",
});

const app = express();

const port = process.env.PORT || 5000;
const handlebars = hbsHelpers();

// hbs.registerHelper("eq", handlebarsEqual);
handlebars.handlebars.registerHelper('eq', handlebarsEqual);
handlebars.handlebars.registerHelper('incrementIndex', function(index) {
  return index + 1;
});

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.json());
app.use(express.static("public"));

// app.engine(
//   "hbs",
//   hbs.express4({
//     layoutsDir: __dirname + "/views/layouts",
//   })
// );
app.engine('hbs', handlebars.engine);



app.set("view engine", "hbs");
app.set("views", publicPath);



app.use("/files", uploadRouter);
app.use("/", userRouter);
app.use("/program", programRouter);
app.use("/session", sessionRouter);
app.use("/participant", participantRouter);
app.use("/admin", adminRouter);

// Manager Dashboard layout
function setManagerLayout(req, res, next) {
  res.locals.layout = 'managerDashboard';
  next();
}
app.use("/manager", setManagerLayout, managerRouter);

// Monitor Dashboard Layout
function setMonitorLayout(req, res, next) {
  res.locals.layout = 'monitorDashboard';
  next();
}
app.use("/monitor", setMonitorLayout, monitorRouter);

// Student Dashboard layout
function setStudentLayout(req, res, next) {
  res.locals.layout = 'studentDashboard';
  next();
}
app.use("/student",setStudentLayout, studentRouter);

// Trainer Dashboard Layout
function setTrainerLayout(req, res, next) {
  res.locals.layout = 'trainerDashboard';
  next();
}
app.use("/trainer", setTrainerLayout, trainerRouter);

app.post("/organization/create", async (req, res) => {
  const { Name } = req.body;
  const created = await prisma.thirdparties.create({
    data: {
      Name,
    },
  });

  return res.redirect("/admin/organizations");
});

app.post("/user/create", async (req, res) => {
  const { Email, Password, UserType, Username, ProgramID } = req.body;
  console.log(ProgramID);

  if(UserType == 'TRAINER' && !ProgramID){
    return res.status(400).json({
      message: "please select progam for trainer",
      success: false
    })
  }
  const ProfilePicture = req.files?.ProfilePicture;
  const existingUser = await prisma.users.findFirst({
    where: {
      Email
    }
  })
  if (existingUser) {
    return res.status(400).json({
      message: "Email already in use",
      success: false
    })
  }
  
  const uploadsDirectory = join(
    process.cwd(),
    "public",
    "uploads",
    "ProfilePicture"
  );

  // Create the uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDirectory)) {
    fs.mkdirSync(uploadsDirectory);
  }
  try {
    let hashedPassword = await hash(Password, 10);
    const created = await prisma.users.create({
      data: {
        Email,
        Password: hashedPassword,
        UserType,
        Username,
        ProgramID,
      },
    });

    if (!ProfilePicture) return res.status(201).json({
      message: "User created successfuly",
      success: true
    })

    const userDirectory = join(uploadsDirectory, `${created.UserID}`);

    if (!fs.existsSync(uploadsDirectory)) {
      fs.mkdirSync(uploadsDirectory, { recursive: true });
    }

    // Create user directory if it doesn't exist
    if (!fs.existsSync(userDirectory)) {
      fs.mkdirSync(userDirectory, { recursive: true });
    }

    const FilePath = join(userDirectory, ProfilePicture.name);
    ProfilePicture.mv(FilePath);
    const path = FilePath.split(process.cwd())[1].replace("\\public", "");
    const updatedUser = await prisma.users.update({
      where: {
        UserID: created.UserID,
      },
      data: {
        ProfilePicture: path,
      },
    });
    return res.status(201).json({
      message: "User created successfuly",
      success: true
    })
  } catch (error) {
    console.log("🚀 ~ app.post ~ error:", error);
  }
});

app.post("/admin/:id/assignment/create", async (req, res) => {
  try {
    const { title, deadline } = req.body;
    const {file} = req.files
    const SessionID = +req.params.id;
  
  const uploadsDirectory = join(process.cwd(), "public", "uploads");

  const sessionDirectory = join(uploadsDirectory, `${SessionID}`);
  if (!file  || !title || !deadline) {
    return res.status(400).json({ error: "Missing Fields" });
  }
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
  const Deadline = new Date(deadline).toLocaleDateString();

  const created = await prisma.assignments.create({
    data: {
      Title: title,
      SessionID,
      Deadline,
      isUploadedByTrainer: true,
      FilePath: path
    },
  });

  return res.status(200).json({
    success: true
  });
  } catch (error) {
    console.log("🚀 ~ app.post ~ error:", error)
    res.status(500).json({ error });
  }
});
app.post("/:id/assignment/create", async (req, res) => {
  const { Title, Deadline } = req.body;
  const deadline = new Date(Deadline).toLocaleDateString();
  const SessionID = +req.params.id;
  const created = await prisma.assignments.create({
    data: {
      Title,
      SessionID,
      Deadline: deadline,
      isUploadedByTrainer: true,
    },
  });

  return res.redirect(`/trainer/${SessionID}/assignments`);
});

app.post("/:id/assignment/mark", async (req, res) => {
  try {
    const { Grade, assignmentID } = req.body;
    if (+Grade > 10) Grade = 10;

    const created = await prisma.assignments.update({
      where: {
        AssignmentID: +assignmentID,
      },
      data: {
        Grade: +Grade,
      },
    });

    return res.redirect(`/trainer/${req.params.id}/assignments`);
  } catch (error) {
    console.log("🚀 ~ app.post ~ error:", error);
  }
});
app.get("/quiz", (_, res) => {
  res.render("quiz");
});
app.post("/reports/:id/create", async (req, res) => {
  const { Name } = req.body;
  const {file} = req.files
    const ProgramID = +req.params.id;
  
  const uploadsDirectory = join(process.cwd(), "public", "uploads");

  const programDirectory = join(uploadsDirectory, `${ProgramID}`);
  if (!file  || !Name ) {
    return res.status(400).json({ error: "Missing Fields" });
  }
if (!fs.existsSync(uploadsDirectory)) {
      fs.mkdirSync(uploadsDirectory, { recursive: true });
    }

    // Create session directory if it doesn't exist
    if (!fs.existsSync(programDirectory)) {
      fs.mkdirSync(programDirectory, { recursive: true });
    }

    const FilePath = join(programDirectory, file.name);
      file.mv(FilePath);
      const path = FilePath.split(process.cwd())[1].replace("\\public", "");
  try {
    const report = await prisma.report.create({
      data: {
        Name,
        ProgramID: +req.params.id,
        FilePath: path
      },
    });
    res.redirect(`/admin/reports/${req.params.id}`);
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
  }
});

app.post('/reports/add-report', async (req, res) => {
  try {
      const { name, ProgramID, SessionID } = req.body;
      const { template } = req.files;

      // Validate inputs
      if (!name || !ProgramID || !SessionID || !template) {
          return res.status(400).json({ error: 'Missing Fields' });
      }

      // Define upload directories
      const uploadsDirectory = path.join(process.cwd(), 'public', 'uploads');
      const sessionDirectory = path.join(uploadsDirectory, `${SessionID}`);
      
      // Create directories if they don't exist
      if (!fs.existsSync(uploadsDirectory)) {
          fs.mkdirSync(uploadsDirectory, { recursive: true });
      }
      if (!fs.existsSync(sessionDirectory)) {
          fs.mkdirSync(sessionDirectory, { recursive: true });
      }

      // Save the file
      const filePath = path.join(sessionDirectory, template.name);
      await template.mv(filePath);
      const relativePath = filePath.split(process.cwd())[1].replace("\\public", "");

      // Save the data to the database
      const reportData = {
          name,
          ProgramID,
          SessionID,
          FilePath: relativePath
      };

      // Assuming you are using a database client, e.g., Prisma, Sequelize, MySQL package
      // Replace this with your actual database client code
      const createdReport = await prisma.report.create({
          data: reportData,
      });

      return res.status(200).json({ success: true, report: createdReport });
  } catch (error) {
      console.error('Error while adding report:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.get("/", (req, res) => {
  res.redirect("/login");
});

app.listen(port, () => console.log(`Listening on port ${port}`));
