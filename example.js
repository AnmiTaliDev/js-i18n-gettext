// Example usage of js-i18n-gettext library
const { Gettext, MoParser } = require('./dist/index.js');

console.log('=== js-i18n-gettext Example (.po and .mo support) ===\n');

// Create Gettext instance
const gt = new Gettext({
  locale: 'ru',
  domain: 'messages'
});

console.log('Current locale:', gt.getLocale());
console.log('Current domain:', gt.getDomain());
console.log();

// Example PO content with Russian translations
const ruPoContent = `
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\\n"
"Language: ru\\n"
"Plural-Forms: nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);\\n"

msgid "Hello, world!"
msgstr "Привет, мир!"

msgid "Welcome"
msgstr "Добро пожаловать"

msgid "One file"
msgid_plural "%d files"
msgstr[0] "%d файл"
msgstr[1] "%d файла"
msgstr[2] "%d файлов"

msgctxt "button"
msgid "Save"
msgstr "Сохранить"

msgctxt "menu"
msgid "Save"
msgstr "Сохранить как"

msgctxt "navigation"
msgid "Home"
msgstr "Главная"

msgid "Thank you"
msgstr "Спасибо"
`;

// Load translations
gt.loadPoFromString(ruPoContent);

console.log('=== Simple Translations ===');
console.log('English: "Hello, world!" -> Russian:', gt._('Hello, world!'));
console.log('English: "Welcome" -> Russian:', gt._('Welcome'));
console.log('English: "Thank you" -> Russian:', gt._('Thank you'));
console.log();

console.log('=== Context-aware Translations ===');
console.log('Button Save:', gt.pgettext('button', 'Save'));
console.log('Menu Save:', gt.pgettext('menu', 'Save'));
console.log('Navigation Home:', gt.pgettext('navigation', 'Home'));
console.log();

console.log('=== Plural Forms (Russian) ===');
for (let count of [1, 2, 5, 21, 22, 25]) {
  console.log(`${count} ->`, gt.ngettext('One file', '%d files', count));
}
console.log();

console.log('=== Fallbacks ===');
console.log('Unknown message:', gt._('This message does not exist'));
console.log('Unknown context:', gt.pgettext('unknown', 'Save'));
console.log();

console.log('=== Headers ===');
const headers = gt.getHeaders();
console.log('Content-Type:', headers['content-type']);
console.log('Language:', headers['language']);
console.log('Plural-Forms:', headers['plural-forms']);

console.log('\n=== Testing MO Format ===');

// Create a test MO file (you would normally load this from a file)
function createTestMoBuffer() {
  // Same data as PO but in binary format
  const strings = [
    { orig: '', trans: 'Content-Type: text/plain; charset=UTF-8\nLanguage: ru\nPlural-Forms: nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);\n' },
    { orig: 'Hello, world!', trans: 'Привет, мир!' },
    { orig: 'One file\0%d files', trans: '%d файл\0%d файла\0%d файлов' }
  ];

  // Simplified MO file creation (normally you'd use msgfmt or similar tools)
  const headerSize = 28;
  const numStrings = strings.length;
  const origTableOffset = headerSize;
  const transTableOffset = origTableOffset + numStrings * 8;
  const stringDataOffset = transTableOffset + numStrings * 8;
  
  const encoder = new TextEncoder();
  const encodedStrings = strings.map(s => ({
    orig: encoder.encode(s.orig),
    trans: encoder.encode(s.trans)
  }));
  
  let stringDataSize = 0;
  encodedStrings.forEach(s => {
    stringDataSize += s.orig.length + s.trans.length;
  });
  
  const buffer = new ArrayBuffer(stringDataOffset + stringDataSize);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);
  
  // Write MO header
  view.setUint32(0, 0x950412de, true); // Magic number
  view.setUint32(4, 0, true); // Version  
  view.setUint32(8, numStrings, true); // Number of strings
  view.setUint32(12, origTableOffset, true);
  view.setUint32(16, transTableOffset, true);
  view.setUint32(20, 0, true);
  view.setUint32(24, 0, true);
  
  let currentOffset = stringDataOffset;
  
  // Write string data and tables
  for (let i = 0; i < numStrings; i++) {
    const origData = encodedStrings[i].orig;
    view.setUint32(origTableOffset + i * 8, origData.length, true);
    view.setUint32(origTableOffset + i * 8 + 4, currentOffset, true);
    uint8View.set(origData, currentOffset);
    currentOffset += origData.length;
  }
  
  for (let i = 0; i < numStrings; i++) {
    const transData = encodedStrings[i].trans;
    view.setUint32(transTableOffset + i * 8, transData.length, true);
    view.setUint32(transTableOffset + i * 8 + 4, currentOffset, true);
    uint8View.set(transData, currentOffset);
    currentOffset += transData.length;
  }
  
  return buffer;
}

const moGt = new Gettext({ locale: 'ru' });
const moBuffer = createTestMoBuffer();

// Load from buffer
moGt.loadMoFromBuffer(moBuffer);

console.log('MO Translation:', moGt._('Hello, world!'));
console.log('MO Plural (1):', moGt.ngettext('One file', '%d files', 1));
console.log('MO Plural (2):', moGt.ngettext('One file', '%d files', 2));
console.log('MO Plural (5):', moGt.ngettext('One file', '%d files', 5));

console.log('\n=== Both formats work perfectly! ===');