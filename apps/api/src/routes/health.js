import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ msg: "Health check successful!" });
});

export default router;
