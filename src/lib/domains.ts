export const publicDomains: string[] = process.env.PUBLIC_DOMAINS
    ? process.env.PUBLIC_DOMAINS.split(',').map(domain => domain.trim())
    : [''];