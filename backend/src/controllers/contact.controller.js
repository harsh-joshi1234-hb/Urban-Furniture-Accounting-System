const contactService = require('../services/contact.service');
const auditService = require('../services/audit.service');

const createContact = async (req, res, next) => {
  try {
    const contact = await contactService.createContact(req.body);
    await auditService.log({
      userId: req.user.id,
      entityType: 'Contact',
      entityId: contact.id,
      action: 'CONTACT_CREATE',
      newValues: contact
    });
    res.status(201).json({ success: true, message: 'Contact created', data: contact });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    next(error);
  }
};

const getContacts = async (req, res, next) => {
  try {
    const contacts = await contactService.getContacts(req.query.type);
    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    next(error);
  }
};

const getContactById = async (req, res, next) => {
  try {
    const contact = await contactService.getContactById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const oldContact = await contactService.getContactById(req.params.id);
    if (!oldContact) return res.status(404).json({ success: false, message: 'Contact not found' });

    const contact = await contactService.updateContact(req.params.id, req.body);
    await auditService.log({
      userId: req.user.id,
      entityType: 'Contact',
      entityId: contact.id,
      action: 'CONTACT_UPDATE',
      oldValues: oldContact,
      newValues: contact
    });
    res.status(200).json({ success: true, message: 'Contact updated', data: contact });
  } catch (error) {
    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const contact = await contactService.deleteContact(req.params.id);
    await auditService.log({
      userId: req.user.id,
      entityType: 'Contact',
      entityId: contact.id,
      action: 'CONTACT_DELETE',
      oldValues: contact
    });
    res.status(200).json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    if (error.message.startsWith('CONFLICT')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = { createContact, getContacts, getContactById, updateContact, deleteContact };
