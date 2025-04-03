export const welcomeEmailTemplate = (name: string) => ({
  subject: "Welcome to AnonHost! 🚀",
  text: `Hi ${name}!
  
  Welcome to AnonHost - we're excited to have you on board!
  
  You can now:
  • Upload and share files instantly
  • Access our powerful API
  • Join our Discord community
  
  Need help getting started? Check out our documentation or reach out to our support team.
  
  Best regards,
  The AnonHost Team`,
  html: `
<div style="background-color: #18181b;">
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #c6cdd4; background: #18181b;">
    <h1 style="color: #ffffff; margin-bottom: 24px; font-size: 24px;">Welcome to AnonHost! 🚀</h1>

    <p style="margin-bottom: 16px; color: #c6cdd4; font-size: 16px;">Hi ${name}!</p>

    <p style="margin-bottom: 24px; color: #c6cdd4; font-size: 16px;">We're excited to have you on board. Your account is now ready to use.</p>

    <div style="background: #27272a; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h2 style="color: #c6cdd4; font-size: 18px; margin-bottom: 16px;">You can now:</h2>
      <ul style="list-style: none; padding-left: 0.25rem; margin: 0;">
        <li style="margin-bottom: 12px; display: flex; align-items: center;">
          <span style="color: #ffffff; margin-right: 8px;">•</span>
          Upload and share files instantly
        </li>
        <li style="margin-bottom: 12px; display: flex; align-items: center;">
          <span style="color: #ffffff; margin-right: 8px;">•</span>
          Access our powerful API
        </li>
        <li style="margin-bottom: 12px; display: flex; align-items: center;">
          <span style="color: #ffffff; margin-right: 8px;">•</span>
          Join our Discord community
        </li>
      </ul>
    </div>

    <p style="margin-bottom: 24px; color: #94a3b8; font-size: 16px;">
      Need help getting started? Check out our <a href="https://anonhost.com/docs" style="color: #80cfff; text-decoration: none;">documentation</a> or reach out to our support team.
    </p>

    <p style="color: #94a3b8; font-size: 16px;">
      Best regards,<br>
      The AnonHost Team
    </p>
  </div>
</div>
`,
});

export const verificationEmailTemplate = (
  code: string,
  email: string,
  type: "login" | "email-change" = "login"
) => ({
  subject: `Your ${type === "email-change" ? "Email Change" : "Login"} Verification Code 🔐`,
  text: `Your verification code is: ${code}
  
This code will expire in 15 minutes.

To verify automatically, visit: ${process.env.NEXT_PUBLIC_APP_URL}/verify?email=${encodeURIComponent(email)}&otp=${code}&type=${type}

If you didn't request this code, please ignore this email.

Best regards,
The AnonHost Team`,
  html: `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #c6cdd4; background: #18181b;">
      <h1 style="color: #ffffff; margin-bottom: 24px; font-size: 24px;">
        ${type === "email-change" ? "Email Change" : "Login"} Verification Code 🔐
      </h1>

      <div style="background: #27272a; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="color: #ffffff; font-size: 24px; letter-spacing: 0.5em; margin: 0;">
          ${code}
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify?email=${encodeURIComponent(email)}&otp=${code}&type=${type}"
          style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Verify Automatically
        </a>
      </div>

      <p style="margin-bottom: 16px; color: #c6cdd4; font-size: 16px;">
        This code will expire in 15 minutes. You can either:
      </p>

      <ul style="color: #c6cdd4; font-size: 16px; margin-bottom: 24px; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Click the button above to verify automatically</li>
        <li style="margin-bottom: 8px;">Enter the code manually in the verification page</li>
      </ul>

      <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px;">
        If you didn't request this code, please ignore this email.
      </p>

      <p style="color: #94a3b8; font-size: 16px; margin-top: 24px; border-top: 1px solid #27272a; padding-top: 24px;">
        Best regards,<br>
        The AnonHost Team
      </p>
    </div>
  `,
});