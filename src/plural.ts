import { PluralRule } from './types';

export class PluralForms {
  private static readonly DEFAULT_PLURAL: PluralRule = {
    nplurals: 2,
    plural: (n: number) => n !== 1 ? 1 : 0
  };

  public static parse(pluralForms: string): PluralRule {
    if (!pluralForms) {
      return this.DEFAULT_PLURAL;
    }

    const npluralsMatch = pluralForms.match(/nplurals\s*=\s*(\d+)/);
    const pluralMatch = pluralForms.match(/plural\s*=\s*([^;]+)/);

    if (!npluralsMatch || !pluralMatch) {
      return this.DEFAULT_PLURAL;
    }

    const nplurals = parseInt(npluralsMatch[1], 10);
    const pluralExpr = pluralMatch[1].trim();

    try {
      const plural = this.compilePluralExpression(pluralExpr);
      return { nplurals, plural };
    } catch (error) {
      console.warn('Failed to parse plural forms, using default:', error);
      return this.DEFAULT_PLURAL;
    }
  }

  private static compilePluralExpression(expr: string): (n: number) => number {
    const sanitized = expr
      .replace(/[^0-9n()?:!<>=&|%+\-*/ ]/g, '')
      .replace(/\bn\b/g, 'n');

    return new Function('n', `return Math.floor(${sanitized});`) as (n: number) => number;
  }
}