// email2faServer.js
import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Replace with your actual email + app password
const transporter = nodemailer.createTransport({
  service: "gmail", // change to "outlook" or "smtp.strathmore.edu" if needed
  auth: {
    user: "rehema.kuria@strathmore.edu",
    pass: "mkcp zdxs fmny knvf",
  },
});

app.post("/send-2fa", async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000); // 6-digit code

  try {
    await transporter.sendMail({
      from: '"StegaShield Security" <youremail@strathmore.edu>',
      to: email,
      subject: "Your 2FA Verification Code",
      html: `<p>Your StegaShield verification code is:</p><h2>${code}</h2><p>This code will expire in 5 minutes.</p>`,
    });

    // Store code temporarily (for now just return it for demo)
    res.json({ success: true, code });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

app.listen(4000, () => console.log("Email 2FA server running on port 4000"));
