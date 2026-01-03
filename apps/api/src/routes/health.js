import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ msg: "Health check successful!" });
});

export default router;
