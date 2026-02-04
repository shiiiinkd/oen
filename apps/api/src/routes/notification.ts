import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { sendMessage } from "../lib/line-messaging.js";
import type { Message } from "../lib/line-messaging.js";

const router = Router();

router.post("/post-created", async (req, res) => {
  try {
    const { postUrl, message } = req.body;
    const lineMessage: Message = {
      type: "text",
      text: `${message}\n${postUrl}`,
    };
    const { data, error } = await supabase
      .from("supporters")
      .select("line_user_id")
      .eq("is_blocked", false);

    if (error) throw error;

    const userIds = data.map(
      (row: { line_user_id: string }) => row.line_user_id,
    );

    if (userIds.length > 0) {
      await sendMessage(userIds, lineMessage);
    }
    res
      .status(200)
      .json({
        message: "Notification sent successfully",
        sentTo: userIds.length,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send notification" });
  }
});

export default router;
