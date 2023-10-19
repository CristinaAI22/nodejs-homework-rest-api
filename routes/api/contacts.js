const express = require("express");

const router = express.Router();

const {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
} = require("../../models/contacts");

router.get("/test", (req, res) => {
  res.send("This is a test route.");
});

router.get("/", async (req, res, next) => {
  try {
    const result = await listContacts();
    if (result.statusCode === 200) {
      return res.status(200).json(result.message);
    }
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", async (req, res, next) => {
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

router.post("/", async (req, res, next) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res
      .status(400)
      .json({ message: "Missing required name, email, or phone field" });
  }
  try {
    const result = await addContact({ name, email, phone });

    if (result.statusCode === 400) {
      return res.status(400).json(result);
    }
    if (result.statusCode === 201) {
      return res.status(201).json(result.message);
    }
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await removeContact(id);

    if (result.statusCode === 200) {
      return res.status(200).json({ message: "Contact deleted" });
    }
    if (result.statusCode === 404) {
      return res.status(404).json({ message: "Not found" });
    }
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", async (req, res, next) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  if (!name && !email && !phone) {
    return res.status(400).json({ message: "Missing fields" });
  }
  try {
    const updatedFields = { name, email, phone };
    const result = await updateContact(id, updatedFields);

    if (result.statusCode === 200) {
      return res.status(200).json(result.message);
    }

    if (result.statusCode === 404) {
      return res.status(404).json({ message: "Not found" });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
