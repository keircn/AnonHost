export const publicDomains: string[] = process.env.PUBLIC_DOMAINS
    ? JSON.parse(process.env.PUBLIC_DOMAINS)
    : [];