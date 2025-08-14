import { Translations, Translation, PoHeader } from './types';

export class PoParser {
  public static parse(content: string): { translations: Translations; headers: PoHeader } {
    const lines = content.split('\n');
    const translations: Translations = {};
    const headers: PoHeader = {};
    
    let currentEntry: Partial<Translation> & { msgid?: string; msgid_plural?: string } = {};
    let inHeader = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith('#')) {
        continue;
      }

      if (line.startsWith('msgctxt ')) {
        this.finalizeEntry(translations, currentEntry);
        currentEntry = { msgstr: [] };
        currentEntry.msgctxt = this.parseString(line.substring(8));
        inHeader = false;
      } else if (line.startsWith('msgid ')) {
        if (!currentEntry.msgctxt) {
          this.finalizeEntry(translations, currentEntry);
          currentEntry = { msgstr: [] };
        }
        currentEntry.msgid = this.parseString(line.substring(6));
        
        if (inHeader && currentEntry.msgid === '') {
          inHeader = true;
        } else {
          inHeader = false;
        }
      } else if (line.startsWith('msgid_plural ')) {
        currentEntry.msgid_plural = this.parseString(line.substring(13));
      } else if (line.startsWith('msgstr')) {
        const match = line.match(/^msgstr(\[(\d+)\])?\s+"(.*)"/);
        if (match) {
          const index = match[2] ? parseInt(match[2], 10) : 0;
          const value = this.parseString(match[3]);
          
          if (!currentEntry.msgstr) {
            currentEntry.msgstr = [];
          }
          currentEntry.msgstr[index] = value;

        }
      } else if (line.startsWith('"')) {
        const value = this.parseString(line);
        if (currentEntry.msgstr && currentEntry.msgstr.length > 0) {
          const lastIndex = currentEntry.msgstr.length - 1;
          currentEntry.msgstr[lastIndex] = (currentEntry.msgstr[lastIndex] || '') + value;
          
        }
      }
    }

    this.finalizeEntry(translations, currentEntry);
    
    // Parse headers from empty msgid entry
    if (translations[''] && translations[''].msgstr && translations[''].msgstr[0]) {
      this.parseHeaders(translations[''].msgstr[0], headers);
      delete translations[''];
    }
    
    return { translations, headers };
  }

  private static parseString(str: string): string {
    if (!str.startsWith('"') || !str.endsWith('"')) {
      return str;
    }
    
    return str
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  private static finalizeEntry(
    translations: Translations,
    entry: Partial<Translation> & { msgid?: string; msgid_plural?: string }
  ): void {
    if (entry.msgid !== undefined && entry.msgstr) {
      const finalKey = entry.msgctxt ? entry.msgctxt + '\u0004' + entry.msgid : entry.msgid;
      translations[finalKey] = {
        msgstr: entry.msgstr,
        msgctxt: entry.msgctxt
      };
    }
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