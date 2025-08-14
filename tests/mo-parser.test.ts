import { MoParser } from '../src/mo-parser';

describe('MoParser', () => {
  // Helper function to create a simple MO file buffer for testing
  function createTestMoBuffer(): ArrayBuffer {
    // This creates a minimal valid MO file with a few test strings
    // MO file structure:
    // - Magic number (4 bytes)
    // - Version (4 bytes)
    // - Number of strings (4 bytes)
    // - Offset to original string table (4 bytes)
    // - Offset to translation string table (4 bytes)
    // - Hash table size (4 bytes) - unused, set to 0
    // - Hash table offset (4 bytes) - unused, set to 0
    
    const strings = [
      { orig: '', trans: 'Content-Type: text/plain; charset=UTF-8\nPlural-Forms: nplurals=2; plural=(n != 1);\n' },
      { orig: 'Hello', trans: 'Привет' },
      { orig: 'One file\0%d files', trans: 'Один файл\0%d файлов' },
      { orig: 'menu\u0004File', trans: 'Файл' }
    ];

    // Calculate sizes
    const headerSize = 28; // 7 * 4 bytes
    const numStrings = strings.length;
    const stringTableSize = numStrings * 8; // Each entry is 8 bytes (length + offset)
    
    // Calculate string data offsets
    const origTableOffset = headerSize;
    const transTableOffset = origTableOffset + stringTableSize;
    const stringDataOffset = transTableOffset + stringTableSize;
    
    // Encode strings to UTF-8
    const encoder = new TextEncoder();
    const encodedStrings = strings.map(s => ({
      orig: encoder.encode(s.orig),
      trans: encoder.encode(s.trans)
    }));
    
    // Calculate total size
    let stringDataSize = 0;
    encodedStrings.forEach(s => {
      stringDataSize += s.orig.length + s.trans.length;
    });
    
    const totalSize = stringDataOffset + stringDataSize;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const uint8View = new Uint8Array(buffer);
    
    // Write header
    view.setUint32(0, 0x950412de, true); // Magic number (little endian)
    view.setUint32(4, 0, true); // Version
    view.setUint32(8, numStrings, true); // Number of strings
    view.setUint32(12, origTableOffset, true); // Original table offset
    view.setUint32(16, transTableOffset, true); // Translation table offset
    view.setUint32(20, 0, true); // Hash table size (unused)
    view.setUint32(24, 0, true); // Hash table offset (unused)
    
    // Write string tables and data
    let currentDataOffset = stringDataOffset;
    
    // Write original string table and data
    for (let i = 0; i < numStrings; i++) {
      const stringData = encodedStrings[i].orig;
      
      // Write table entry
      view.setUint32(origTableOffset + i * 8, stringData.length, true); // Length
      view.setUint32(origTableOffset + i * 8 + 4, currentDataOffset, true); // Offset
      
      // Write string data
      uint8View.set(stringData, currentDataOffset);
      currentDataOffset += stringData.length;
    }
    
    // Write translation string table and data
    for (let i = 0; i < numStrings; i++) {
      const stringData = encodedStrings[i].trans;
      
      // Write table entry
      view.setUint32(transTableOffset + i * 8, stringData.length, true); // Length
      view.setUint32(transTableOffset + i * 8 + 4, currentDataOffset, true); // Offset
      
      // Write string data
      uint8View.set(stringData, currentDataOffset);
      currentDataOffset += stringData.length;
    }
    
    return buffer;
  }

  describe('parse', () => {
    it('should parse a valid MO file', () => {
      const buffer = createTestMoBuffer();
      const result = MoParser.parse(buffer);
      
      expect(result.translations['Hello']).toEqual({
        msgstr: ['Привет'],
        msgctxt: undefined
      });
      
      expect(result.translations['One file']).toEqual({
        msgstr: ['Один файл', '%d файлов'],
        msgctxt: undefined
      });
      
      expect(result.translations['menu\u0004File']).toEqual({
        msgstr: ['Файл'],
        msgctxt: 'menu'
      });
      
      expect(result.headers['content-type']).toBe('text/plain; charset=UTF-8');
      expect(result.headers['plural-forms']).toBe('nplurals=2; plural=(n != 1);');
    });

    it('should throw error for invalid magic number', () => {
      const buffer = new ArrayBuffer(28);
      const view = new DataView(buffer);
      view.setUint32(0, 0x12345678, true); // Invalid magic
      
      expect(() => MoParser.parse(buffer)).toThrow('Invalid MO file: bad magic number');
    });

    it('should throw error for unsupported version', () => {
      const buffer = new ArrayBuffer(28);
      const view = new DataView(buffer);
      view.setUint32(0, 0x950412de, true); // Valid magic
      view.setUint32(4, 1, true); // Unsupported version
      
      expect(() => MoParser.parse(buffer)).toThrow('Unsupported MO file version: 1');
    });

    it('should handle big endian files', () => {
      const buffer = new ArrayBuffer(28);
      const view = new DataView(buffer);
      
      // Create minimal big endian MO file
      view.setUint32(0, 0xde120495, false); // Big endian magic
      view.setUint32(4, 0, false); // Version
      view.setUint32(8, 0, false); // Number of strings
      view.setUint32(12, 28, false); // Original table offset
      view.setUint32(16, 28, false); // Translation table offset
      view.setUint32(20, 0, false); // Hash table size
      view.setUint32(24, 0, false); // Hash table offset
      
      const result = MoParser.parse(buffer);
      expect(result.translations).toEqual({});
      expect(result.headers).toEqual({});
    });
  });

  describe('parseFromUint8Array', () => {
    it('should parse from Uint8Array', () => {
      const buffer = createTestMoBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      const result = MoParser.parseFromUint8Array(uint8Array);
      
      expect(result.translations['Hello']).toEqual({
        msgstr: ['Привет'],
        msgctxt: undefined
      });
    });
  });
});