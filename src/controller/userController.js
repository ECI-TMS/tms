import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/db.js";

// View Users
export async function view(req, res) {
  try {
    // User the connection
    const users = await prisma.users.findMany({
      where: {
        UserType: "STUDENT",
      },
    });

    res.status(200).json({
      users,
    });
  } catch (error) {
    res.status(400).json({
      error,
      message: "error occured while fetching the users",
    });
  }
}

export async function login(req, res) {
  const email = req.body.Email;
  const password = req.body.Password;

  try {
    let userData = await prisma.users.findFirst({
      where: {
        Email: email,
      },
    });

    if (!userData) {
      return res.status(400).json({ errors: "Invalid Email Or Password " });
    }

    const passwordMatches = await compare(password, userData.Password);

    if (!passwordMatches) {
      return res.status(400).json({ errors: "Invalid Email Or Password " });
    }

    // Create a JWT token for the user
    const token = jwt.sign(
      {
        ...userData,
        Password: null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set the JWT token in a cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // expires in 1 day
    });

    // Return the user data
    return res.json({ userData });
  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
}
