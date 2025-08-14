import { GettextOptions, Translations, PluralRule, PoHeader } from './types';
import { PoParser } from './parser';
import { MoParser } from './mo-parser';
import { PluralForms } from './plural';

export class Gettext {
  private translations: Translations = {};
  private pluralRule: PluralRule;
  private locale: string;
  private domain: string;
  private headers: PoHeader = {};

  constructor(options: GettextOptions = {}) {
    this.locale = options.locale || 'en';
    this.domain = options.domain || 'messages';
    this.pluralRule = {
      nplurals: 2,
      plural: (n: number) => n !== 1 ? 1 : 0
    };
  }

  public loadPo(filePath: string, readFileFunction?: (path: string) => Promise<string>): Promise<void> {
    if (readFileFunction) {
      return readFileFunction(filePath).then(content => {
        this.loadPoFromString(content);
      }).catch(error => {
        throw new Error(`Failed to load PO file: ${error}`);
      });
    }
    
    throw new Error('File loading requires a readFileFunction parameter. In Node.js, you can use: import { promises as fs } from "fs"; gt.loadPo(path, (p) => fs.readFile(p, "utf-8"))');
  }

  public loadPoFromString(content: string): void {
    const { translations, headers } = PoParser.parse(content);
    this.translations = translations;
    this.headers = headers;

    if (headers['plural-forms']) {
      this.pluralRule = PluralForms.parse(headers['plural-forms']);
    }
  }

  public loadMo(filePath: string, readFileFunction?: (path: string) => Promise<ArrayBuffer>): Promise<void> {
    if (readFileFunction) {
      return readFileFunction(filePath).then(buffer => {
        this.loadMoFromBuffer(buffer);
      }).catch(error => {
        throw new Error(`Failed to load MO file: ${error}`);
      });
    }
    
    throw new Error('File loading requires a readFileFunction parameter. In Node.js, you can use: import { promises as fs } from "fs"; gt.loadMo(path, async (p) => (await fs.readFile(p)).buffer)');
  }

  public loadMoFromBuffer(buffer: ArrayBuffer): void {
    const { translations, headers } = MoParser.parse(buffer);
    this.translations = translations;
    this.headers = headers;

    if (headers['plural-forms']) {
      this.pluralRule = PluralForms.parse(headers['plural-forms']);
    }
  }

  public loadMoFromUint8Array(data: Uint8Array): void {
    const { translations, headers } = MoParser.parseFromUint8Array(data);
    this.translations = translations;
    this.headers = headers;

    if (headers['plural-forms']) {
      this.pluralRule = PluralForms.parse(headers['plural-forms']);
    }
  }

  public _(message: string): string {
    const translation = this.translations[message];
    if (translation && translation.msgstr && translation.msgstr[0]) {
      return translation.msgstr[0];
    }
    return message;
  }

  public gettext(message: string): string {
    return this._(message);
  }

  public ngettext(singular: string, plural: string, count: number): string {
    const key = singular;
    const translation = this.translations[key];
    
    if (translation && translation.msgstr) {
      const pluralIndex = this.pluralRule.plural(count);
      const clampedIndex = Math.min(pluralIndex, translation.msgstr.length - 1);
      
      if (translation.msgstr[clampedIndex]) {
        return translation.msgstr[clampedIndex].replace(/%d/g, count.toString());
      }
    }

    return count === 1 ? singular : plural.replace(/%d/g, count.toString());
  }

  public pgettext(context: string, message: string): string {
    const contextKey = context + '\u0004' + message;
    const translation = this.translations[contextKey];
    
    if (translation && translation.msgstr && translation.msgstr[0]) {
      return translation.msgstr[0];
    }

    return this._(message);
  }

  public npgettext(context: string, singular: string, plural: string, count: number): string {
    const contextKey = context + '\u0004' + singular;
    const translation = this.translations[contextKey];
    
    if (translation && translation.msgstr) {
      const pluralIndex = this.pluralRule.plural(count);
      const clampedIndex = Math.min(pluralIndex, translation.msgstr.length - 1);
      
      if (translation.msgstr[clampedIndex]) {
        return translation.msgstr[clampedIndex].replace(/%d/g, count.toString());
      }
    }

    return this.ngettext(singular, plural, count);
  }

  public setLocale(locale: string): void {
    this.locale = locale;
  }

  public getLocale(): string {
    return this.locale;
  }

  public setDomain(domain: string): void {
    this.domain = domain;
  }

  public getDomain(): string {
    return this.domain;
  }

  public getHeaders(): PoHeader {
    return { ...this.headers };
  }

  public clearTranslations(): void {
    this.translations = {};
    this.headers = {};
    this.pluralRule = {
      nplurals: 2,
      plural: (n: number) => n !== 1 ? 1 : 0
    };
  }

  public getTranslations(): Translations {
    return { ...this.translations };
  }
}