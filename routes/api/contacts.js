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
    console.log(result);

    if (result) {
      return res.status(200).json({ message: "Contact deleted" });
    } else {
      return res.status(404).json({ message: "Contact not found" });
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

module.exports = router;
