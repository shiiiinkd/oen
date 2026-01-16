import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ msg: "auth callback endpoint!" });
});

router.get("/me", (req, res) => {
  res.json({ msg: "auth router is working!" });
});

export default router;
