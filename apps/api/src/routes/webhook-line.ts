import { supabase } from "../lib/supabase.js";
import { middleware } from "@line/bot-sdk";
import { Router } from "express";

const router = Router();

const channelSecret = process.env.LINE_MESSAGING_CHANNEL_SECRET;

if (!channelSecret) {
  throw new Error(
    "Environment variable LINE_MESSAGING_CHANNEL_SECRET is not set"
  );
}

const config = {
  channelSecret,
};

type FollowEvent = {
  type: "follow";
  timestamp: number;
  source: {
    userId: string;
  };
};

type UnfollowEvent = {
  type: "unfollow";
  timestamp: number;
  source: {
    userId: string;
  };
};

type WebhookEvent = FollowEvent | UnfollowEvent;

router.post("/", middleware(config), async (req, res) => {
  const events: WebhookEvent[] = req.body.events;

  for (const event of events) {
    if (event.type === "follow") {
      await supabase.from("users").upsert({
        line_user_id: event.source.userId,
        is_blocked: false,
        updated_at: new Date(event.timestamp),
      });
    } else if (event.type === "unfollow") {
      await supabase
        .from("users")
        .update({
          is_blocked: true,
          updated_at: new Date(event.timestamp),
        })
        .eq("line_user_id", event.source.userId);
    }
  }
  res.status(200).json({ message: "events received" });
});

export default router;
