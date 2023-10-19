const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");

const contactsPath = path.join(__dirname, "contacts.json");

const schema = Joi.object({
  name: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: { allow: ["com", "net"] },
  }),
  phone: Joi.string().pattern(/^[+\d\s-]+$/),
});
const validateInput = async (input) => {
  try {
    await schema.validateAsync(input);
    return null;
  } catch (error) {
    return error.details[0].message;
  }
};

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
    const newContacts = contacts.filter((c) => c.id !== contactId);
    await fs.writeFile(contactsPath, JSON.stringify(newContacts));
    console.log(newContacts);
    return { message: "Contact deleted successfully!" };
  } catch (error) {
    console.log(error.message);
  }
};

const addContact = async (body) => {
  try {
    const { name, email, phone } = body;
    const validationError = await validateInput({ name, email, phone });

    if (validationError) {
      return {
        statusCode: 400,
        message: "Validation error: " + validationError,
      };
    }
    const data = await fs.readFile(contactsPath);
    const contacts = JSON.parse(data);
    const newContact = {
      id: uuidv4(),
      name,
      email,
      phone,
    };
    const newContacts = [...contacts, newContact];
    await fs.writeFile(contactsPath, JSON.stringify(newContacts));
    return { statusCode: 200, message: newContacts };
  } catch (error) {
    console.error(error.message);
  }
};

const updateContact = async (contactId, body) => {
  try {
    const { name, email, phone } = body;
    const validationError = await validateInput({ name, email, phone });

    if (validationError) {
      return {
        statusCode: 400,
        message: "Validation error: " + validationError,
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
    contacts[index] = {
      id: contactId,
      name,
      email,
      phone,
    };
    await fs.writeFile(contactsPath, JSON.stringify(contacts));
    return { statusCode: 200, message: "Contact updated successfully!" };
  } catch (error) {
    console.error(error.message);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
