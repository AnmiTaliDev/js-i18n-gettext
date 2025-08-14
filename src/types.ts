export interface GettextOptions {
  locale?: string;
  domain?: string;
}

export interface Translation {
  msgstr: string[];
  msgctxt?: string;
}

export interface Translations {
  [key: string]: Translation;
}

export interface PluralRule {
  nplurals: number;
  plural: (n: number) => number;
}

export interface PoHeader {
  'content-type'?: string;
  'plural-forms'?: string;
  language?: string;
  [key: string]: string | undefined;
}