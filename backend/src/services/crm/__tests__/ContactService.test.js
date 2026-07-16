// Mock the repository before importing the service
jest.mock('../../../repositories/ContactRepository');

const ContactService = require('../ContactService');
const ContactRepository = require('../../../repositories/ContactRepository');

describe('ContactService', () => {
  let mockRepository;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Get the mocked repository instance
    mockRepository = ContactRepository.mock.instances[0];
    
    // Ensure mockRepository exists
    if (!mockRepository) {
      mockRepository = {
        create: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        search: jest.fn(),
        bulkCreate: jest.fn(),
        addNote: jest.fn(),
        getNotes: jest.fn(),
        deleteNote: jest.fn(),
      };
      ContactService.repository = mockRepository;
    }
  });

  describe('create', () => {
    it('should create a contact with valid data', async () => {
      const contactData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const mockCreatedContact = {
        id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        stage: 'new',
        org_id: 1,
        created_at: new Date(),
        last_touch_at: new Date(),
      };

      ContactService.repository.create = jest.fn().mockResolvedValue(mockCreatedContact);

      const result = await ContactService.create(contactData, 1, 100);

      expect(result).toMatchObject({
        id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        stage: 'new',
      });
      expect(result.displayName).toBe('John Doe');
      expect(ContactService.repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'John Doe',
          email: 'john@example.com',
          stage: 'new',
        }),
        1,
        100
      );
    });

    it('should normalize email to lowercase', async () => {
      const contactData = {
        full_name: 'Jane Doe',
        email: 'JANE@EXAMPLE.COM',
        phone: '+1234567890',
      };

      const mockCreatedContact = {
        id: 2,
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1234567890',
        stage: 'new',
        org_id: 1,
      };

      ContactService.repository.create = jest.fn().mockResolvedValue(mockCreatedContact);

      await ContactService.create(contactData, 1, 100);

      expect(ContactService.repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'jane@example.com',
        }),
        1,
        100
      );
    });

    it('should set default stage to "new"', async () => {
      const contactData = {
        full_name: 'Test Contact',
        email: 'test@example.com',
      };

      const mockCreatedContact = {
        id: 3,
        full_name: 'Test Contact',
        email: 'test@example.com',
        stage: 'new',
        org_id: 1,
      };

      ContactService.repository.create = jest.fn().mockResolvedValue(mockCreatedContact);

      await ContactService.create(contactData, 1, 100);

      expect(ContactService.repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'new',
        }),
        1,
        100
      );
    });

    it('should throw error if neither email nor phone provided', async () => {
      const contactData = {
        full_name: 'Invalid Contact',
      };

      await expect(
        ContactService.create(contactData, 1, 100)
      ).rejects.toThrow('Contact must have either email or phone number');
    });

    it('should throw error for invalid email format', async () => {
      const contactData = {
        full_name: 'Invalid Email',
        email: 'not-an-email',
      };

      await expect(
        ContactService.create(contactData, 1, 100)
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw error for invalid phone format', async () => {
      const contactData = {
        full_name: 'Invalid Phone',
        phone: '123', // Too short
      };

      await expect(
        ContactService.create(contactData, 1, 100)
      ).rejects.toThrow('Invalid phone format');
    });

    it('should throw error for invalid stage', async () => {
      const contactData = {
        full_name: 'Invalid Stage',
        email: 'test@example.com',
        stage: 'invalid_stage',
      };

      await expect(
        ContactService.create(contactData, 1, 100)
      ).rejects.toThrow('Invalid contact stage');
    });

    it('should throw error for negative value', async () => {
      const contactData = {
        full_name: 'Negative Value',
        email: 'test@example.com',
        value_ngn: -100,
      };

      await expect(
        ContactService.create(contactData, 1, 100)
      ).rejects.toThrow('Contact value cannot be negative');
    });
  });

  describe('update', () => {
    it('should update a contact with valid data', async () => {
      const existingContact = {
        id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        stage: 'new',
        org_id: 1,
      };

      const updateData = {
        full_name: 'John Updated',
        stage: 'contacted',
      };

      const mockUpdatedContact = {
        ...existingContact,
        ...updateData,
      };

      ContactService.repository.findById = jest.fn().mockResolvedValue(existingContact);
      ContactService.repository.update = jest.fn().mockResolvedValue(mockUpdatedContact);

      const result = await ContactService.update(1, updateData, 1, 100);

      expect(result.full_name).toBe('John Updated');
      expect(result.stage).toBe('contacted');
      expect(ContactService.repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          full_name: 'John Updated',
          stage: 'contacted',
        }),
        1,
        100
      );
    });

    it('should return null if contact not found', async () => {
      ContactService.repository.findById = jest.fn().mockResolvedValue(null);

      const result = await ContactService.update(999, { full_name: 'Test' }, 1, 100);

      expect(result).toBeNull();
      expect(ContactService.repository.update).not.toHaveBeenCalled();
    });

    it('should throw error if update removes both email and phone', async () => {
      const existingContact = {
        id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        stage: 'new',
        org_id: 1,
      };

      ContactService.repository.findById = jest.fn().mockResolvedValue(existingContact);

      await expect(
        ContactService.update(1, { email: null, phone: null }, 1, 100)
      ).rejects.toThrow('Contact must have either email or phone number');
    });
  });

  describe('search', () => {
    it('should search contacts by query', async () => {
      const mockContacts = [
        {
          id: 1,
          full_name: 'John Doe',
          email: 'john@example.com',
          stage: 'new',
          last_touch_at: new Date(),
        },
        {
          id: 2,
          full_name: 'Jane Doe',
          email: 'jane@example.com',
          stage: 'contacted',
          last_touch_at: new Date(),
        },
      ];

      ContactService.repository.search = jest.fn().mockResolvedValue(mockContacts);

      const results = await ContactService.search(1, 'Doe');

      expect(results).toHaveLength(2);
      expect(results[0].displayName).toBe('John Doe');
      expect(results[1].displayName).toBe('Jane Doe');
      expect(ContactService.repository.search).toHaveBeenCalledWith(1, 'Doe', {});
    });

    it('should search with filters', async () => {
      const mockContacts = [
        {
          id: 1,
          full_name: 'John Doe',
          email: 'john@example.com',
          stage: 'contacted',
          last_touch_at: new Date(),
        },
      ];

      ContactService.repository.search = jest.fn().mockResolvedValue(mockContacts);

      const results = await ContactService.search(1, 'Doe', { stage: 'contacted' });

      expect(results).toHaveLength(1);
      expect(results[0].stage).toBe('contacted');
      expect(ContactService.repository.search).toHaveBeenCalledWith(1, 'Doe', { stage: 'contacted' });
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple valid contacts', async () => {
      const contacts = [
        { full_name: 'Contact 1', email: 'contact1@example.com' },
        { full_name: 'Contact 2', email: 'contact2@example.com' },
      ];

      const mockCreatedContacts = contacts.map((c, i) => ({
        id: i + 1,
        ...c,
        email: c.email.toLowerCase(),
        stage: 'new',
        org_id: 1,
        last_touch_at: new Date(),
      }));

      ContactService.repository.bulkCreate = jest.fn().mockResolvedValue(mockCreatedContacts);

      const result = await ContactService.bulkCreate(contacts, 1, 100);

      expect(result.created).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(ContactService.repository.bulkCreate).toHaveBeenCalled();
    });

    it('should handle validation errors in bulk create', async () => {
      const contacts = [
        { full_name: 'Valid Contact', email: 'valid@example.com' },
        { full_name: 'Invalid Contact' }, // Missing email and phone
        { full_name: 'Another Valid', phone: '+1234567890' },
      ];

      const mockCreatedContacts = [
        { id: 1, full_name: 'Valid Contact', email: 'valid@example.com', stage: 'new', org_id: 1, last_touch_at: new Date() },
        { id: 2, full_name: 'Another Valid', phone: '+1234567890', stage: 'new', org_id: 1, last_touch_at: new Date() },
      ];

      ContactService.repository.bulkCreate = jest.fn().mockResolvedValue(mockCreatedContacts);

      const result = await ContactService.bulkCreate(contacts, 1, 100);

      expect(result.created).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(1);
      expect(result.errors[0].error).toContain('email or phone');
    });
  });

  describe('addNote', () => {
    it('should add note to existing contact', async () => {
      const mockContact = {
        id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        org_id: 1,
      };

      const mockNote = {
        id: 1,
        contact_id: 1,
        content: 'Test note',
        created_by: 100,
        created_at: new Date(),
      };

      ContactService.repository.findById = jest.fn().mockResolvedValue(mockContact);
      ContactService.repository.addNote = jest.fn().mockResolvedValue(mockNote);

      const result = await ContactService.addNote(
        1,
        { content: 'Test note' },
        1,
        100
      );

      expect(result.content).toBe('Test note');
      expect(ContactService.repository.addNote).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ content: 'Test note', orgId: 1 }),
        100
      );
    });

    it('should throw error if contact not found', async () => {
      ContactService.repository.findById = jest.fn().mockResolvedValue(null);

      await expect(
        ContactService.addNote(999, { content: 'Test note' }, 1, 100)
      ).rejects.toThrow('Contact not found');
    });

    it('should throw error if note content is empty', async () => {
      const mockContact = {
        id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        org_id: 1,
      };

      ContactService.repository.findById = jest.fn().mockResolvedValue(mockContact);

      await expect(
        ContactService.addNote(1, { content: '' }, 1, 100)
      ).rejects.toThrow('Note content is required');
    });
  });

  describe('enrichEntity', () => {
    it('should enrich contact with computed fields', () => {
      const contact = {
        id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        stage: 'new',
        last_touch_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      };

      const enriched = ContactService.enrichEntity(contact);

      expect(enriched.displayName).toBe('John Doe');
      expect(enriched.hasRecentActivity).toBe(true);
      expect(enriched.daysSinceLastTouch).toBe(10);
      expect(enriched.isStale).toBe(false);
    });

    it('should mark contact as stale if no recent activity', () => {
      const contact = {
        id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        stage: 'new',
        last_touch_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
      };

      const enriched = ContactService.enrichEntity(contact);

      expect(enriched.hasRecentActivity).toBe(false);
      expect(enriched.daysSinceLastTouch).toBe(40);
      expect(enriched.isStale).toBe(true);
    });

    it('should use email as display name if no full name', () => {
      const contact = {
        id: 1,
        email: 'john@example.com',
        stage: 'new',
      };

      const enriched = ContactService.enrichEntity(contact);

      expect(enriched.displayName).toBe('john@example.com');
    });

    it('should not mark won/lost contacts as stale', () => {
      const contact = {
        id: 1,
        full_name: 'John Doe',
        email: 'john@example.com',
        stage: 'won',
        last_touch_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
      };

      const enriched = ContactService.enrichEntity(contact);

      expect(enriched.isStale).toBe(false);
    });
  });

  describe('helper methods', () => {
    it('should validate email correctly', () => {
      expect(ContactService.isValidEmail('test@example.com')).toBe(true);
      expect(ContactService.isValidEmail('invalid-email')).toBe(false);
      expect(ContactService.isValidEmail('test@')).toBe(false);
      expect(ContactService.isValidEmail('@example.com')).toBe(false);
    });

    it('should validate phone correctly', () => {
      expect(ContactService.isValidPhone('+1234567890')).toBe(true);
      expect(ContactService.isValidPhone('(123) 456-7890')).toBe(true);
      expect(ContactService.isValidPhone('123')).toBe(false);
    });

    it('should normalize phone correctly', () => {
      expect(ContactService.normalizePhone('(123) 456-7890')).toBe('1234567890');
      expect(ContactService.normalizePhone('+1-234-567-8900')).toBe('+12345678900');
    });

    it('should validate stage correctly', () => {
      expect(ContactService.isValidStage('new')).toBe(true);
      expect(ContactService.isValidStage('contacted')).toBe(true);
      expect(ContactService.isValidStage('won')).toBe(true);
      expect(ContactService.isValidStage('invalid')).toBe(false);
    });
  });
});