import { Router } from "express";

const router = Router();

router.get("/me", (req, res) => {
  res.json({ msg: "auth router is working!" });
});

export default router;
