import { PoParser } from '../src/parser';

describe('PoParser', () => {
  describe('parse', () => {
    it('should parse simple PO content', () => {
      const content = `
msgid "Hello"
msgstr "Привет"

msgid "World"
msgstr "Мир"
`;

      const { translations } = PoParser.parse(content);
      
      expect(translations['Hello']).toEqual({
        msgstr: ['Привет']
      });
      expect(translations['World']).toEqual({
        msgstr: ['Мир']
      });
    });

    it('should parse plural forms', () => {
      const content = `
msgid "One item"
msgid_plural "%d items"
msgstr[0] "Один элемент"
msgstr[1] "%d элементов"
`;

      const { translations } = PoParser.parse(content);
      
      expect(translations['One item']).toEqual({
        msgstr: ['Один элемент', '%d элементов']
      });
    });

    it('should parse context', () => {
      const content = `
msgctxt "menu"
msgid "File"
msgstr "Файл"
`;

      const { translations } = PoParser.parse(content);
      
      expect(translations['menu\u0004File']).toEqual({
        msgstr: ['Файл'],
        msgctxt: 'menu'
      });
    });

    it('should parse headers', () => {
      const content = `
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\\n"
"Language: ru\\n"
"Plural-Forms: nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);\\n"
`;

      const { headers } = PoParser.parse(content);
      
      expect(headers['content-type']).toBe('text/plain; charset=UTF-8');
      expect(headers['language']).toBe('ru');
      expect(headers['plural-forms']).toContain('nplurals=3');
    });

    it('should handle multiline strings', () => {
      const content = `
msgid ""
"Line 1\\n"
"Line 2"
msgstr ""
"Строка 1\\n"
"Строка 2"
`;

      const { translations } = PoParser.parse(content);
      
      expect(translations['Line 1\nLine 2']).toEqual({
        msgstr: ['Строка 1\nСтрока 2']
      });
    });

    it('should handle escaped characters', () => {
      const content = `
msgid "Say \\"Hello\\""
msgstr "Скажи \\"Привет\\""
`;

      const { translations } = PoParser.parse(content);
      
      expect(translations['Say "Hello"']).toEqual({
        msgstr: ['Скажи "Привет"']
      });
    });

    it('should skip comments and empty lines', () => {
      const content = `
# This is a comment
#. Translator comment

msgid "Hello"
msgstr "Привет"

# Another comment
`;

      const { translations } = PoParser.parse(content);
      
      expect(translations['Hello']).toEqual({
        msgstr: ['Привет']
      });
    });
  });
});