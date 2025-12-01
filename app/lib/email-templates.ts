export const newsletterWelcomeTemplate = (email: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .logo { font-size: 24px; font-weight: bold; color: #0f172a; }
    .content { padding: 30px 20px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ EduFlow</div>
    </div>
    <div class="content">
      <h2>Welcome to the Community!</h2>
      <p>Hi there,</p>
      <p>Thanks for subscribing to the EduFlow newsletter. We're excited to have you on board!</p>
      <p>You'll be the first to know about:</p>
      <ul>
        <li>New automation features for teachers</li>
        <li>Tips and tricks for classroom management</li>
        <li>Exclusive updates and roadmap announcements</li>
      </ul>
      <p>Stay tuned for our next update.</p>
      <a href="https://eduflow.com" class="button">Visit Dashboard</a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} EduFlow Inc. All rights reserved.</p>
      <p>You received this email because you subscribed to updates from EduFlow.</p>
    </div>
  </div>
</body>
</html>
`;
