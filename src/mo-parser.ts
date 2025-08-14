import { Translations, Translation, PoHeader } from './types';

export class MoParser {
  private static readonly MO_MAGIC_LITTLE_ENDIAN = 0x950412de;
  private static readonly MO_MAGIC_BIG_ENDIAN = 0xde120495;

  public static parse(buffer: ArrayBuffer): { translations: Translations; headers: PoHeader } {
    const view = new DataView(buffer);
    const translations: Translations = {};
    const headers: PoHeader = {};

    // Read magic number to determine endianness
    const magic = view.getUint32(0, true);
    let littleEndian = true;

    if (magic === this.MO_MAGIC_LITTLE_ENDIAN) {
      littleEndian = true;
    } else if (magic === this.MO_MAGIC_BIG_ENDIAN) {
      littleEndian = false;
    } else {
      throw new Error('Invalid MO file: bad magic number');
    }

    // Read MO file header
    const version = view.getUint32(4, littleEndian);
    const numStrings = view.getUint32(8, littleEndian);
    const origTableOffset = view.getUint32(12, littleEndian);
    const transTableOffset = view.getUint32(16, littleEndian);

    // Validate version
    if (version !== 0) {
      throw new Error(`Unsupported MO file version: ${version}`);
    }

    // Read string tables
    const origStrings = this.readStringTable(view, origTableOffset, numStrings, littleEndian);
    const transStrings = this.readStringTable(view, transTableOffset, numStrings, littleEndian);

    // Process translations
    for (let i = 0; i < numStrings; i++) {
      const origString = origStrings[i];
      const transString = transStrings[i];

      if (origString === '') {
        // This is the header entry
        this.parseHeaders(transString, headers);
      } else {
        this.processTranslation(origString, transString, translations);
      }
    }

    return { translations, headers };
  }

  public static parseFromUint8Array(data: Uint8Array): { translations: Translations; headers: PoHeader } {
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    return this.parse(buffer);
  }

  private static readStringTable(
    view: DataView,
    tableOffset: number,
    numStrings: number,
    littleEndian: boolean
  ): string[] {
    const strings: string[] = [];

    for (let i = 0; i < numStrings; i++) {
      const entryOffset = tableOffset + i * 8;
      const length = view.getUint32(entryOffset, littleEndian);
      const offset = view.getUint32(entryOffset + 4, littleEndian);

      // Extract string bytes
      const stringBytes = new Uint8Array(view.buffer, offset, length);
      
      // Convert to string (assuming UTF-8)
      const string = new TextDecoder('utf-8').decode(stringBytes);
      strings.push(string);
    }

    return strings;
  }

  private static processTranslation(origString: string, transString: string, translations: Translations): void {
    // Check if this is a plural form (contains \0)
    const origParts = origString.split('\0');
    const transParts = transString.split('\0');

    let key: string;
    let msgctxt: string | undefined;

    // Check if original string has context (contains \u0004)
    if (origParts[0].includes('\u0004')) {
      const contextParts = origParts[0].split('\u0004');
      msgctxt = contextParts[0];
      key = msgctxt + '\u0004' + contextParts[1];
    } else {
      key = origParts[0];
    }

    // Store translation
    translations[key] = {
      msgstr: transParts,
      msgctxt
    };
  }

  private static parseHeaders(headerString: string, headers: PoHeader): void {
    const lines = headerString.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim().toLowerCase();
        const value = trimmed.substring(colonIndex + 1).trim();
        if (key && value) {
          headers[key] = value;
        }
      }
    }
  }
}