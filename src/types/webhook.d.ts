export interface WebhookPayload {
  content?: string;
  embeds?: Array<{
    title: string;
    description: string;
    color?: number;
    image?: {
      url: string;
    };
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    footer?: {
      text: string;
    };
  }>;
}
