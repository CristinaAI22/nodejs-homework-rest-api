const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");

const contactsPath = path.join(__dirname, "contacts.json");

const contactSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .pattern(/^[A-Za-z\s]+$/)
    .required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .min(3)
    .pattern(/^[0-9() +-.]+$/)
    .required(),
});

const listContacts = async () => {
  try {
    const data = await fs.readFile(contactsPath);
    const contacts = JSON.parse(data);
    return contacts;
  } catch (error) {
    console.log(error.message);
  }
};

const getContactById = async (contactId) => {
  try {
    const data = await fs.readFile(contactsPath);
    const contacts = JSON.parse(data);
    const contact = contacts.filter((c) => c.id === contactId);
    if (contact.length > 0) {
      return contact;
    } else {
      return { message: "No match found!" };
    }
  } catch (error) {
    console.log(error.message);
  }
};

const removeContact = async (contactId) => {
  try {
    const data = await fs.readFile(contactsPath);
    const contacts = JSON.parse(data);
    const contactsIndex = contacts.findIndex((c) => c.id === contactId);
    if (contactsIndex === -1) {
      return false;
    }
    contacts.splice(contactsIndex, 1);
    await fs.writeFile(contactsPath, JSON.stringify(contacts));
    return true;
  } catch (error) {
    return false;
  }
};
const addContact = async (body) => {
  try {
    const { name, email, phone } = body;
    const { error, value } = contactSchema.validate({ name, email, phone });

    if (error) {
      return {
        success: false,
        message: "Validation error: " + error.details[0].message,
      };
    }
    const data = await fs.readFile(contactsPath);
    const contacts = JSON.parse(data);
    const newContact = {
      id: uuidv4(),
      name: value.name,
      email: value.email,
      phone: value.phone,
    };
    const newContacts = [...contacts, newContact];
    await fs.writeFile(contactsPath, JSON.stringify(newContacts));
    return {
      success: true,
      message: "Contact added successfully",
      data: newContact,
    };
  } catch (error) {
    console.error(error.message);
    return { success: false, message: "Error adding contact" };
  }
};

const updateContact = async (contactId, body) => {
  try {
    const { name, email, phone } = body;
    const { error, value } = contactSchema.validate({ name, email, phone });

    if (error) {
      return {
        statusCode: 400,
        message: "Validation error: " + error.details[0].message,
      };
    }

    const data = await fs.readFile(contactsPath);
    const contacts = JSON.parse(data);
    const index = contacts.findIndex((c) => c.id === contactId);

    if (index === -1) {
      return {
        statusCode: 404,
        message: "Contact not found",
      };
    }
    const originalContact = contacts[index];
    const updatedFields = {};

    if (originalContact.name !== value.name) {
      updatedFields.name = {
        oldValue: originalContact.name,
        newValue: value.name,
      };
    }
    if (originalContact.email !== value.email) {
      updatedFields.email = {
        oldValue: originalContact.email,
        newValue: value.email,
      };
    }
    if (originalContact.phone !== value.phone) {
      updatedFields.phone = {
        oldValue: originalContact.phone,
        newValue: value.phone,
      };
    }
    const updatedContact = {
      id: contactId,
      name: value.name,
      email: value.email,
      phone: value.phone,
    };
    contacts[index] = updatedContact;
    await fs.writeFile(contactsPath, JSON.stringify(contacts));
    return {
      success: true,
      message: "Contact updated successfully",
      updatedFields: updatedFields,
    };
  } catch (error) {
    console.error(error.message);
    return { success: false, message: "Internal Server Error" };
  }
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
