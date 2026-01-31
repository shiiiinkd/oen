import * as line from "@line/bot-sdk";

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN!,
});

if (!client) {
  throw new Error(
    "Environment variable LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is not set",
  );
}

export type TextMessage = {
  type: "text";
  text: string;
};

// 将来の拡張例（今は定義だけ・未実装）
// export type ImageMessage = {
//   type: 'image';
//   originalContentUrl: string;
//   previewImageUrl: string;
// };

// 送信メッセージの型（現時点ではTextMessageのみ）
export type Message = TextMessage;

export async function sendMessage(
  userIds: string,
  message: Message,
): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  await client.multicast({
    to: [userIds],
    messages: [message],
  });
}
