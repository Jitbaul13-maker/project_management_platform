import mailgen from "mailgen";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_SMTP_HOST,
  port: Number(process.env.MAILTRAP_SMTP_PORT),
  auth: {
    user: process.env.MAILTRAP_SMTP_USER,
    pass: process.env.MAILTRAP_SMTP_PASSWORD,
  },
});

const mailGenerator = new mailgen({
  theme: "default",
  product: {
    name: "Task Manager",
    link: "https://taskmanagerlink.com",
  },
});

const sendEmail = async (options) => {
  const emailText = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHTML = mailGenerator.generate(options.mailgenContent);

  const mail = {
    from: "mail.taskmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: emailText,
    html: emailHTML,
  };

  await transporter.sendMail(mail);
};

const emailVerificationMailgenContent = (username, verificationurl) => {
  return {
    body: {
      name: username,
      intro: "Welcome!!!",
      action: {
        instruction: "Click here to verify email",
        button: {
          color: "#22BC23",
          text: "Verify",
          link: verificationurl,
        },
      },
      outro: "Reach us for any help!!!",
    },
  };
};

const passwordResetMailgenContent = (username, passwordreseturl) => {
  return {
    body: {
      name: username,
      intro: "Welcome!!!",
      action: {
        instruction: "Password reset...",
        button: {
          color: "#0e830e",
          text: "reset",
          link: passwordreseturl,
        },
      },
      outro: "Reach us for any help!!!",
    },
  };
};

export {
  emailVerificationMailgenContent,
  passwordResetMailgenContent,
  sendEmail,
};
