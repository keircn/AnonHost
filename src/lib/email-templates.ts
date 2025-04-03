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

    `,
});

export const verificationEmailTemplate = (code: string) => ({
  subject: "Your Verification Code 🔐",
  text: `Your verification code is: ${code}
            
        This code will expire in 15 minutes.

        If you didn't request this code, please ignore this email.

        Best regards,
        The AnonHost Team`,
  html: `
                <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #c6cdd4; background: #18181b;">
                    <h1 style="color: #ffffff; margin-bottom: 24px; font-size: 24px;">Your Verification Code 🔐</h1>

                    <div style="background: #27272a; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                        <p style="color: #ffffff; font-size: 24px; text-align: center; letter-spacing: 0.5em; margin: 0;">
                            ${code}
                        </p>
                    </div>

                    <p style="margin-bottom: 16px; color: #c6cdd4; font-size: 16px;">
                        This code will expire in 15 minutes.
                    </p>

                    <p style="color: #94a3b8; font-size: 14px;">
                        If you didn't request this code, please ignore this email.
                    </p>

                    <p style="color: #94a3b8; font-size: 16px; margin-top: 24px;">
                        Best regards,<br>
                        The AnonHost Team
                    </p>
                </div>
            `,
});