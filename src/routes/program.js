import { Router } from "express";
import { getPrograms } from "../controller/programController.js";
import prisma from "../lib/db.js";

const router = Router();

router.get("/", getPrograms);

router.get("/:id", async (req, res) => {
  try {
    const data = await prisma.programs.findUnique({
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
