import { Router } from "express";
import { login, view } from "../controller/userController.js";
const router = Router();

// Routes
router.get("/all", view);
router
  .route("/login")
  .post(login)
  .get((req, res) => {
    return res.render("homepage",{layout:false});
  });
// router.get("/adduser", form);
// router.post("/adduser", create);
// router.get("/edituser/:id", edit);
// router.post("/edituser/:id", update);
// router.get("/viewuser/:id", viewall);
// router.get("/:id", delete);

export default router;
