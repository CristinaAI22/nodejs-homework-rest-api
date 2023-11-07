const Joi = require("joi");
const Contact = require("./Contact");

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
    const contacts = await Contact.find();
    console.log(contacts);
    return contacts;
  } catch (error) {
    console.log(error.message);
  }
};

const getContactById = async (contactId) => {
  try {
    const contact = await Contact.findById(contactId);
    console.log(contact);
    if (!contact) {
      return { message: "No match found!" };
    } else {
      return contact;
    }
  } catch (error) {
    console.log(error.message);
  }
};

const removeContact = async (contactId) => {
  try {
    const contact = await Contact.findByIdAndRemove(contactId);
    if (contact) {
      return true;
    } else {
      return false;
    }
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

    const newContact = await Contact.create({
      name: value.name,
      email: value.email,
      phone: value.phone,
    });

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

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      {
        name: value.name,
        email: value.email,
        phone: value.phone,
      },
      { new: true }
    );

    if (!contact) {
      return {
        statusCode: 404,
        message: "Contact not found",
      };
    }

    const updatedFields = {};

    if (contact.name !== value.name) {
      updatedFields.name = {
        oldValue: contact.name,
        newValue: value.name,
      };
    }
    if (contact.email !== value.email) {
      updatedFields.email = {
        oldValue: contact.email,
        newValue: value.email,
      };
    }
    if (contact.phone !== value.phone) {
      updatedFields.phone = {
        oldValue: contact.phone,
        newValue: value.phone,
      };
    }

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
const updateStatusContact = async (req, res) => {
  const { contactId } = req.params;
  const { favorite } = req.body;

  if (typeof favorite === "undefined") {
    return res.status(400).json({ message: "missing field favorite" });
  }

  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      contactId,
      { favorite },
      { new: true }
    );

    if (!updatedContact) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Favorite status updated successfully",
      updatedFields: { favorite: favorite },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
};
