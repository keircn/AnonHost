export async function sendDiscordWebhook(payload: {
  content?: string;
  embeds?: Array<{
    title: string;
    description: string;
    color?: number;
    image?: { url: string };
    fields?: Array<{ name: string; inline?: boolean; value: string }>;
  }>;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Discord webhook error:', error);
  }
}
