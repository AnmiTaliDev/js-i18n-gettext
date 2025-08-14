import { Gettext } from '../src/gettext';

describe('Gettext', () => {
  let gt: Gettext;

  beforeEach(() => {
    gt = new Gettext();
  });

  describe('Basic functionality', () => {
    it('should return original message when no translation is loaded', () => {
      expect(gt._('Hello world')).toBe('Hello world');
    });

    it('should handle gettext alias', () => {
      expect(gt.gettext('Hello world')).toBe('Hello world');
    });

    it('should set and get locale', () => {
      gt.setLocale('ru');
      expect(gt.getLocale()).toBe('ru');
    });

    it('should set and get domain', () => {
      gt.setDomain('custom');
      expect(gt.getDomain()).toBe('custom');
    });
  });

  describe('PO file loading', () => {
    it('should throw error without readFileFunction', async () => {
      await expect(gt.loadPo('test.po')).rejects.toThrow('File loading requires a readFileFunction parameter');
    });

    it('should load PO file with readFileFunction', async () => {
      const mockReadFile = jest.fn().mockResolvedValue(`
msgid "Hello"
msgstr "Привет"
`);
      
      await gt.loadPo('test.po', mockReadFile);
      expect(gt._('Hello')).toBe('Привет');
      expect(mockReadFile).toHaveBeenCalledWith('test.po');
    });
  });

  describe('MO file loading', () => {
    function createTestMoBuffer(): ArrayBuffer {
      // Create a simple MO file for testing
      const buffer = new ArrayBuffer(100);
      const view = new DataView(buffer);
      const uint8View = new Uint8Array(buffer);
      
      // MO file header
      view.setUint32(0, 0x950412de, true); // Magic number
      view.setUint32(4, 0, true); // Version
      view.setUint32(8, 1, true); // Number of strings
      view.setUint32(12, 28, true); // Original table offset
      view.setUint32(16, 36, true); // Translation table offset
      view.setUint32(20, 0, true); // Hash table size
      view.setUint32(24, 0, true); // Hash table offset
      
      // String tables (1 entry each)
      view.setUint32(28, 5, true); // Original string length
      view.setUint32(32, 44, true); // Original string offset
      view.setUint32(36, 6, true); // Translation string length  
      view.setUint32(40, 50, true); // Translation string offset
      
      // String data
      const encoder = new TextEncoder();
      const origBytes = encoder.encode('Hello');
      const transBytes = encoder.encode('Привет');
      
      uint8View.set(origBytes, 44);
      uint8View.set(transBytes, 50);
      
      return buffer;
    }

    it('should throw error without readFileFunction', async () => {
      await expect(gt.loadMo('test.mo')).rejects.toThrow('File loading requires a readFileFunction parameter');
    });

    it('should load MO file with readFileFunction', async () => {
      const testBuffer = createTestMoBuffer();
      const mockReadFile = jest.fn().mockResolvedValue(testBuffer);
      
      await gt.loadMo('test.mo', mockReadFile);
      expect(gt._('Hello')).toBe('Привет');
      expect(mockReadFile).toHaveBeenCalledWith('test.mo');
    });

    it('should load MO from buffer', () => {
      const testBuffer = createTestMoBuffer();
      
      gt.loadMoFromBuffer(testBuffer);
      expect(gt._('Hello')).toBe('Привет');
    });

    it('should load MO from Uint8Array', () => {
      const testBuffer = createTestMoBuffer();
      const uint8Array = new Uint8Array(testBuffer);
      
      gt.loadMoFromUint8Array(uint8Array);
      expect(gt._('Hello')).toBe('Привет');
    });
  });

  describe('PO string loading', () => {
    const samplePo = `
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"

msgid "Hello world"
msgstr "Привет мир"

msgid "One item"
msgid_plural "%d items"
msgstr[0] "Один элемент"
msgstr[1] "%d элементов"

msgctxt "menu"
msgid "File"
msgstr "Файл"
`;

    beforeEach(() => {
      gt.loadPoFromString(samplePo);
    });

    it('should translate simple messages', () => {
      expect(gt._('Hello world')).toBe('Привет мир');
    });

    it('should handle plural forms', () => {
      expect(gt.ngettext('One item', '%d items', 1)).toBe('Один элемент');
      expect(gt.ngettext('One item', '%d items', 5)).toBe('5 элементов');
    });

    it('should handle context translations', () => {
      expect(gt.pgettext('menu', 'File')).toBe('Файл');
    });

    it('should fall back to simple translation for unknown context', () => {
      expect(gt.pgettext('unknown', 'Hello world')).toBe('Привет мир');
    });

    it('should handle npgettext', () => {
      expect(gt.npgettext('menu', 'One item', '%d items', 1)).toBe('Один элемент');
      expect(gt.npgettext('menu', 'One item', '%d items', 5)).toBe('5 элементов');
    });

    it('should return headers', () => {
      const headers = gt.getHeaders();
      expect(headers['content-type']).toBe('text/plain; charset=UTF-8');
      expect(headers['plural-forms']).toBe('nplurals=2; plural=(n != 1);');
    });

    it('should clear translations', () => {
      gt.clearTranslations();
      expect(gt._('Hello world')).toBe('Hello world');
      expect(Object.keys(gt.getHeaders())).toHaveLength(0);
    });
  });

  describe('Fallback behavior', () => {
    it('should return original message for missing translations', () => {
      expect(gt._('Unknown message')).toBe('Unknown message');
    });

    it('should handle plural forms without translation', () => {
      expect(gt.ngettext('One thing', '%d things', 1)).toBe('One thing');
      expect(gt.ngettext('One thing', '%d things', 5)).toBe('5 things');
    });

    it('should handle context without translation', () => {
      expect(gt.pgettext('context', 'Unknown')).toBe('Unknown');
    });
  });
});