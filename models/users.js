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

const signupUser = async (body) => {
  try {
    const { email, password } = body;
    const user = await User.findOne({ email });
    if (user) {
      return { statusCode: 409, message: "Email is already in use" };
    }
    const { error } = userSchema.validate(body);

    if (error) {
      console.error(error.message);
      return { statusCode: 400, message: `Bad Request: ${error.message} ` };
    }
    const avatarURL = gravatar.url(email);
    const createdUser = new User({ email, password, avatarURL });
    createdUser.setPass(password);
    await createdUser.save();
    return { statusCode: 201, message: createdUser };
  } catch (err) {
    console.log(err);
    return { statusCode: 400, message: `Bad Request` };
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
};
