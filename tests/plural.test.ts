import { PluralForms } from '../src/plural';

describe('PluralForms', () => {
  describe('parse', () => {
    it('should parse simple plural forms', () => {
      const rule = PluralForms.parse('nplurals=2; plural=(n != 1);');
      
      expect(rule.nplurals).toBe(2);
      expect(rule.plural(1)).toBe(0);
      expect(rule.plural(0)).toBe(1);
      expect(rule.plural(2)).toBe(1);
      expect(rule.plural(5)).toBe(1);
    });

    it('should parse complex Russian plural forms', () => {
      const pluralExpr = 'nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);';
      const rule = PluralForms.parse(pluralExpr);
      
      expect(rule.nplurals).toBe(3);
      expect(rule.plural(1)).toBe(0); // один
      expect(rule.plural(21)).toBe(0); // двадцать один
      expect(rule.plural(2)).toBe(1); // два
      expect(rule.plural(3)).toBe(1); // три
      expect(rule.plural(4)).toBe(1); // четыре
      expect(rule.plural(5)).toBe(2); // пять
      expect(rule.plural(11)).toBe(2); // одиннадцать
      expect(rule.plural(12)).toBe(2); // двенадцать
    });

    it('should handle single form languages', () => {
      const rule = PluralForms.parse('nplurals=1; plural=0;');
      
      expect(rule.nplurals).toBe(1);
      expect(rule.plural(0)).toBe(0);
      expect(rule.plural(1)).toBe(0);
      expect(rule.plural(10)).toBe(0);
    });

    it('should use default for invalid plural forms', () => {
      const rule = PluralForms.parse('invalid');
      
      expect(rule.nplurals).toBe(2);
      expect(rule.plural(1)).toBe(0);
      expect(rule.plural(0)).toBe(1);
      expect(rule.plural(2)).toBe(1);
    });

    it('should use default for empty plural forms', () => {
      const rule = PluralForms.parse('');
      
      expect(rule.nplurals).toBe(2);
      expect(rule.plural(1)).toBe(0);
      expect(rule.plural(0)).toBe(1);
      expect(rule.plural(2)).toBe(1);
    });

    it('should handle malformed expressions safely', () => {
      const rule = PluralForms.parse('nplurals=2; plural=malformed_expression;');
      
      expect(rule.nplurals).toBe(2);
      expect(rule.plural(1)).toBe(0);
      expect(rule.plural(2)).toBe(1);
    });
  });
});