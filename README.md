
# react-native-pdf-to-image

## Installation

```sh
npm install react-native-pdf-to-image
```

## Usage
```js
import { convert, convertB64 } from 'react-native-pdf-to-image';

const uri = 'file:///data/.........' // Any PDF file uri
const images = await convert(uri);   // { outputFiles: [' /* image file path in cache */'] }
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
