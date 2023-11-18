const { User, userSchema } = require("./User");
const Contact = require("./Contact");
require("dotenv").config();
require("./config-passport");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const SECRET = process.env.SECRET;
const gravatar = require("gravatar");
const multer = require("multer");
const jimp = require("jimp");
const path = require("path");
const uploadDir = path.join(process.cwd(), "tmp");
const storeImage = path.join(process.cwd(), "public", "avatars");
const nodemailer = require("nodemailer");
const uuid = require("uuid");

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.OUTLOOK_EMAIL,
    pass: process.env.OUTLOOK_PASSWORD,
  },
});
const resendVerificationEmail = async (email, verificationToken) => {
  const mailOptions = {
    from: process.env.OUTLOOK_EMAIL,
    to: email,
    subject: "Resend Email Verification",
    text: `Click the following link to verify your email: http://localhost:27017/users/verify/${verificationToken}`,
  };

  await transporter.sendMail(mailOptions);
};
const signupUser = async (body) => {
  try {
    const { email, password } = body;
    const user = await User.findOne({ email });

    if (user) {
      if (user.verify) {
        return { statusCode: 400, message: "User is already verified" };
      }
      await resendVerificationEmail(email, user.verificationToken);

      return {
        statusCode: 200,
        message: "Verification email resent. Check your inbox.",
      };
    }

    const { error } = userSchema.validate(body);

    if (error) {
      console.error(error.message);
      return { statusCode: 400, message: `Bad Request: ${error.message} ` };
    }

    const verificationToken = uuid.v4();
    const avatarURL = gravatar.url(email);
    const createdUser = new User({
      email,
      password,
      avatarURL,
      verificationToken,
    });

    createdUser.setPass(password);
    await createdUser.save();

    await transporter.sendMail({
      from: process.env.OUTLOOK_EMAIL,
      to: email,
      subject: "Email Verification",
      text: `Click the following link to verify your email: http://localhost:27017/users/verify/${verificationToken}`,
    });

    return {
      statusCode: 201,
      message: "User registered successfully. Verification email sent.",
    };
  } catch (err) {
    console.error(err.message);
    return { statusCode: 500, message: "Internal Server Error" };
  }
};

const loginUser = async (body) => {
  const { email, password } = body;
  const user = await User.findOne({ email });
  const isSamePass = user.isSamePass(password);
  if (isSamePass) {
    const payload = {
      id: user.id,
      email: user.email,
      admin: false,
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: "2w" });
    user.setToken(token);
    await user.save();
    return {
      statusCode: 200,
      message: {
        token,
        user: {
          email,
          subscription: user.subscription,
        },
      },
    };
  } else {
    return {
      statusCode: 401,
      message: "Email or password is wrong",
    };
  }
};

const auth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (!user || err) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Unauthorized",
        data: "Unauthorized",
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};
const logOutUser = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "Not authorized!!!" });
  }

  try {
    const decodedToken = jwt.verify(token.replace("Bearer ", ""), SECRET);
    req.userId = decodedToken.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

const addUserContact = async (user, contactToAdd) => {
  try {
    const newContact = await Contact.create({
      owner: user._id,
      ...contactToAdd,
    });
    return { statusCode: 200, message: newContact };
  } catch (error) {
    console.log(error.message);
    return {
      statusCode: 400,
      message: { message: "a required field is not ok" },
    };
  }
};

const getUserContacts = async (user) => {
  try {
    const userContacts = await Contact.find({ owner: user._id });
    return { statusCode: 200, message: userContacts };
  } catch (err) {
    return { statusCode: 401, message: err.message || "bad request" };
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
  limits: {
    fileSize: 1048576,
  },
});
console.log(storeImage);

const upload = multer({
  storage: storage,
});

const updateAvatar = async (user, file) => {
  try {
    if (!user) {
      return { statusCode: 401, message: "Not authorized" };
    }

    const image = await jimp.read(file.path);
    image.resize(250, 250);
    const fileExt = path.extname(file.originalname);
    const uniqueFileName = `${user.email.replace(
      /[^a-zA-Z0-9]/g,
      ""
    )}${Date.now()}${fileExt}`;
    const avatarPath = path.join(
      process.cwd(),
      "public",
      "avatars",
      uniqueFileName
    );
    image.write(avatarPath);
    user.avatarURL = `/avatars/${uniqueFileName}`;
    await user.save();
    return { statusCode: 200, message: user.avatarURL };
  } catch (err) {
    return { statusCode: 400, message: "Bad request" };
  }
};

module.exports = {
  signupUser,
  loginUser,
  auth,
  logOutUser,
  addUserContact,
  getUserContacts,
  upload,
  updateAvatar,
  resendVerificationEmail,
};
