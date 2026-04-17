# react-native-pdf-to-image

Convert PDF pages into PNG images from React Native.

The library exposes native methods for:

- converting a PDF file URI into cached PNG images
- converting a base64-encoded PDF into cached PNG images
- sending a base64 PDF payload to a socket printer

## Features

- supports Android and iOS
- returns one output image path per PDF page
- writes generated images into the app cache directory
- works with local file URIs and copied document-picker files

## Installation

```sh
npm install react-native-pdf-to-image
```

If you are using iOS, install pods after adding the package:

```sh
cd ios && pod install
```

## Requirements

- React Native app with native modules enabled
- not supported in Expo Go
- on iOS, rebuild the app after installation

## API

### `convert(uri: string): Promise<{ outputFiles: string[] | undefined }>`

Converts a PDF referenced by a local URI into PNG files.

```ts
import { convert } from 'react-native-pdf-to-image';

const result = await convert('file:///path/to/document.pdf');

console.log(result.outputFiles);
// ['/.../Library/Caches/1713370000000-1_pdf.png', ...]
```

### `convertB64(base64Str: string, dpi: number): Promise<{ outputFiles: string[] | undefined }>`

Converts a base64-encoded PDF string into PNG files.

The `dpi` argument is used as the target output width for the rendered page images.

```ts
import { convertB64 } from 'react-native-pdf-to-image';

const result = await convertB64(pdfBase64String, 1024);

console.log(result.outputFiles);
// ['/cache/...png', '/cache/...png']
```

### `printPDF(ip: string, port: number, base64Str: string): Promise<number>`

Sends a base64-encoded PDF directly to a socket printer.

```ts
import { printPDF } from 'react-native-pdf-to-image';

await printPDF('192.168.0.25', 9100, pdfBase64String);
```

## Example

The example app uses `react-native-document-picker` to let the user choose a PDF, copies it into the cache directory, then passes the copied file URI into `convert()`.

```ts
import DocumentPicker from 'react-native-document-picker';
import { convert } from 'react-native-pdf-to-image';

const docs = await DocumentPicker.pick({
  type: DocumentPicker.types.pdf,
  copyTo: 'cachesDirectory',
});

if (docs.length) {
  const uri = docs[0]?.fileCopyUri || '';
  const result = await convert(uri);
  console.log(result.outputFiles);
}
```

## Notes

- `outputFiles` contains absolute file paths for the generated PNG images.
- Generated files are written to the app cache directory, so you should move them if you need long-term storage.
- File URIs are the most reliable input for `convert()`.
- Large PDFs can produce many images, so watch cache usage if you convert frequently.

## Troubleshooting

If you see a linking error:

- run `pod install` on iOS
- rebuild the app after installing the package
- confirm you are not running inside Expo Go

If the example app fails during `pod install` on older React Native 0.72 setups, the bundled Boost mirror may need to be rewritten during CocoaPods install. The example project in this repository already includes that workaround.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
