const express = require("express");

const router = express.Router();

const {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
} = require("../../models/contacts");
const {
  signupUser,
  loginUser,
  auth,
  logOutUser,
  addUserContact,
  getUserContacts,
  upload,
  updateAvatar,
} = require("../../models/users");
const { User } = require("../../models/User");

router.get("/contacts", async (req, res, next) => {
  res.status(200);
  const data = await listContacts();
  res.json(data);
});

router.get("/contacts/:contactId", async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const contact = await getContactById(contactId);
    if (!contact) {
      return res.status(404).json({ message: "No match found!" });
    }
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

router.post("/contacts", async (req, res, next) => {
  const contactToCreate = req.body;

  try {
    const result = await addContact(contactToCreate);

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    next(error);
  }
});

router.delete("/contacts/:contactId", async (req, res, next) => {
  const { contactId } = req.params;

  try {
    const result = await removeContact(contactId);

    if (result.message === "Contact deleted!") {
      return res.status(200).json({ message: "Contact deleted successfully" });
    } else if (result.message === "The provided ID does not exist") {
      return res.status(404).json({ message: "Contact not found" });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", async (req, res, next) => {
  const { contactId } = req.params;
  const { name, email, phone } = req.body;
  try {
    const result = await updateContact(contactId, { name, email, phone });

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    next(error);
  }
});

router.patch("/:contactId/favorite", async (req, res, next) => {
  const { contactId } = req.params;
  const { favorite } = req.body;

  try {
    const result = await updateStatusContact(contactId, { favorite });

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    next(error);
  }
});

router.post("/users/signup", async (req, res) => {
  const body = req.body;
  const data = await signupUser(body);
  const { statusCode, message } = data;
  res.status(statusCode).json(message);
});

router.post("/users/login", async (req, res) => {
  const body = req.body;
  const data = await loginUser(body);
  const { statusCode, message } = data;
  res.status(statusCode).json(message);
});

router.get("/users/logout", logOutUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    user.token = null;
    await user.save();
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/users/current", auth, (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const responseBody = {
      email: user.email,
      subscription: user.subscription,
    };
    return res.status(200).json({ ResponseBody: responseBody });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/users/contacts", auth, async (req, res) => {
  try {
    const user = req.user;
    const contactToAdd = req.body;
    const newContact = await addUserContact(user, contactToAdd);
    return res
      .status(newContact.statusCode)
      .json({ message: newContact.message });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/users/contacts", auth, async (req, res) => {
  try {
    const user = req.user;
    const newContact = await getUserContacts(user);
    return res
      .status(newContact.statusCode)
      .json({ message: newContact.message });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
router.patch(
  "/users/avatars",
  auth,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const user = req.user;
      console.log(User);

      const file = req.file;
      console.log(file);

      const data = await updateAvatar(user, file);
      console.log(data);
      res.status(data.statusCode).json({ avatarURL: data.message });
    } catch (err) {
      console.log(err);
      res.status(400).json({ message: "Bad request" });
    }
  }
);

module.exports = router;
