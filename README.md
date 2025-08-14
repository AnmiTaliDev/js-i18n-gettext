# js-i18n-gettext

JavaScript library for internationalization using Gettext format (.po/.pot/.mo files).

## Features

- Support for standard Gettext functions: `_()`, `ngettext()`, `pgettext()`
- Load and parse .po/.pot files (text format)
- Load and parse .mo files (binary format)
- Plural forms support with complex expressions
- Context-aware translations
- TypeScript support
- Browser and Node.js compatible
- Lightweight and fast

## Installation

```bash
npm install js-i18n-gettext
```

## Usage

```javascript
import { Gettext } from 'js-i18n-gettext';

// Initialize
const gt = new Gettext();

// Load from string (works in browser and Node.js)
const poContent = `
msgid "Hello world"
msgstr "Привет мир"
`;
gt.loadPoFromString(poContent);

// Load PO file (Node.js example)
import { promises as fs } from 'fs';
await gt.loadPo('/path/to/translations.po', (path) => fs.readFile(path, 'utf-8'));

// Load MO file (Node.js example)
await gt.loadMo('/path/to/translations.mo', async (path) => (await fs.readFile(path)).buffer);

// Simple translation
const message = gt._('Hello world');

// Plural forms
const count = 5;
const plural = gt.ngettext('One item', '%d items', count);

// Context-aware translation
const contextual = gt.pgettext('menu', 'File');
```

## API

### `new Gettext(options?)`

Create a new Gettext instance.

**Options:**
- `locale` - Default locale (default: 'en')
- `domain` - Text domain (default: 'messages')

### `loadPo(path: string, readFileFunction: (path: string) => Promise<string>): Promise<void>`

Load translations from a .po/.pot file using provided file reader function.

### `loadPoFromString(content: string): void`

Load translations from PO file content string.

### `loadMo(path: string, readFileFunction: (path: string) => Promise<ArrayBuffer>): Promise<void>`

Load translations from a .mo file using provided file reader function.

### `loadMoFromBuffer(buffer: ArrayBuffer): void`

Load translations from MO file buffer.

### `loadMoFromUint8Array(data: Uint8Array): void`

Load translations from MO file Uint8Array data.

### `_(message: string): string`

Translate a message.

### `ngettext(singular: string, plural: string, count: number): string`

Handle plural forms.

### `pgettext(context: string, message: string): string`

Context-aware translation.

## File Formats

### .po/.pot files (Text format)
Human-readable text files with translations. Easy to edit and review.

```javascript
// Load from string
gt.loadPoFromString(`
msgid "Hello"
msgstr "Привет"
`);

// Load from file (Node.js)
import { promises as fs } from 'fs';
await gt.loadPo('messages.po', (path) => fs.readFile(path, 'utf-8'));
```

### .mo files (Binary format)
Compiled binary files. Faster to load and smaller in size.

```javascript
// Load from ArrayBuffer
const buffer = /* your ArrayBuffer */;
gt.loadMoFromBuffer(buffer);

// Load from file (Node.js)
import { promises as fs } from 'fs';
await gt.loadMo('messages.mo', async (path) => (await fs.readFile(path)).buffer);

// Load from Uint8Array (e.g., from fetch)
const response = await fetch('/translations.mo');
const data = new Uint8Array(await response.arrayBuffer());
gt.loadMoFromUint8Array(data);
```

### Browser Usage

```javascript
// Fetch and load MO file in browser
const response = await fetch('/locales/ru/messages.mo');
const buffer = await response.arrayBuffer();
gt.loadMoFromBuffer(buffer);

// Or with Uint8Array
const data = new Uint8Array(buffer);
gt.loadMoFromUint8Array(data);
```

## License

GNU LGPL 3.0 - see [LICENSE](LICENSE.md) file.

## Author

AnmiTaliDev <anmitali198@gmail.com>

## Repository

https://github.com/AnmiTaliDev/js-i18n-gettext