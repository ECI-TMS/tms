import prisma from "../lib/db.js";

export async function getPrograms(req, res) {
  try {
    const data = await prisma.programs.findMany();

    if (!data) return res.status(400).json({ message: "something went wrong" });

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error });
  }
}
