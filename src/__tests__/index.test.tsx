type ReactNativeModuleMock = {
  NativeModules: {
    PdfToImage?: {
      convert: jest.Mock;
      convertB64: jest.Mock;
      printPDF: jest.Mock;
    };
  };
  Platform: {
    select: jest.Mock;
  };
};

function loadModule({
  nativeModule = {
    convert: jest.fn(),
    convertB64: jest.fn(),
    printPDF: jest.fn(),
  },
  platform = 'ios',
}: {
  nativeModule?:
    | {
        convert: jest.Mock;
        convertB64: jest.Mock;
        printPDF: jest.Mock;
      }
    | null
    | undefined;
  platform?: 'ios' | 'android';
}) {
  jest.resetModules();

  const reactNativeMock: ReactNativeModuleMock = {
    NativeModules: {
      PdfToImage: nativeModule ?? undefined,
    },
    Platform: {
      select: jest.fn(({ ios, default: defaultValue }) =>
        platform === 'ios' ? ios : defaultValue
      ),
    },
  };

  jest.doMock('react-native', () => reactNativeMock);

  let module: typeof import('../index');
  jest.isolateModules(() => {
    module = require('../index');
  });

  return { module: module!, reactNativeMock };
}

describe('react-native-pdf-to-image', () => {
  afterEach(() => {
    jest.resetModules();
    jest.unmock('react-native');
    jest.clearAllMocks();
  });

  it('exposes the native module methods through named and default exports', async () => {
    const { module, reactNativeMock } = loadModule({});
    const convertResult = { outputFiles: ['cache/output.png'] };
    const convertB64Result = {
      outputFiles: ['cache/output-1.png', 'cache/output-2.png'],
    };

    reactNativeMock.NativeModules.PdfToImage?.convert.mockResolvedValueOnce(
      convertResult
    );
    reactNativeMock.NativeModules.PdfToImage?.convertB64.mockResolvedValueOnce(
      convertB64Result
    );
    reactNativeMock.NativeModules.PdfToImage?.printPDF.mockResolvedValueOnce(1);

    await expect(module.convert('file:///tmp/input.pdf')).resolves.toEqual(
      convertResult
    );
    expect(
      reactNativeMock.NativeModules.PdfToImage?.convert
    ).toHaveBeenCalledWith('file:///tmp/input.pdf');

    await expect(module.convertB64('ZmFrZQ==', 1024)).resolves.toEqual(
      convertB64Result
    );
    expect(
      reactNativeMock.NativeModules.PdfToImage?.convertB64
    ).toHaveBeenCalledWith('ZmFrZQ==', 1024);

    await expect(
      module.printPDF('192.168.0.10', 9100, 'ZmFrZQ==')
    ).resolves.toBe(1);
    expect(
      reactNativeMock.NativeModules.PdfToImage?.printPDF
    ).toHaveBeenCalledWith('192.168.0.10', 9100, 'ZmFrZQ==');

    expect(module.default.convert).toBe(module.convert);
    expect(module.default.convertB64).toBe(module.convertB64);
    expect(module.default.printPDF).toBe(module.printPDF);
  });

  it('propagates native promise rejections', async () => {
    const { module, reactNativeMock } = loadModule({});
    const convertError = new Error('convert failed');
    const convertB64Error = new Error('convertB64 failed');
    const printError = new Error('print failed');

    reactNativeMock.NativeModules.PdfToImage?.convert.mockRejectedValueOnce(
      convertError
    );
    reactNativeMock.NativeModules.PdfToImage?.convertB64.mockRejectedValueOnce(
      convertB64Error
    );
    reactNativeMock.NativeModules.PdfToImage?.printPDF.mockRejectedValueOnce(
      printError
    );

    await expect(module.convert('file:///tmp/input.pdf')).rejects.toThrow(
      'convert failed'
    );
    await expect(module.convertB64('ZmFrZQ==', 300)).rejects.toThrow(
      'convertB64 failed'
    );
    await expect(
      module.printPDF('192.168.0.10', 9100, 'ZmFrZQ==')
    ).rejects.toThrow('print failed');
  });

  it('throws a helpful linking error on iOS when the native module is missing', () => {
    const { module } = loadModule({ nativeModule: null, platform: 'ios' });

    expect(() => module.convert('file:///tmp/input.pdf')).toThrow(
      "The package 'react-native-pdf-to-image' doesn't seem to be linked."
    );
    expect(() => module.convert('file:///tmp/input.pdf')).toThrow(
      "You have run 'pod install'"
    );
    expect(() =>
      module.default.printPDF('127.0.0.1', 9100, 'ZmFrZQ==')
    ).toThrow('You rebuilt the app after installing the package');
  });

  it('throws a platform-specific linking error outside iOS when the native module is missing', () => {
    const { module } = loadModule({
      nativeModule: null,
      platform: 'android',
    });

    expect(() => module.convertB64('ZmFrZQ==', 512)).toThrow(
      "The package 'react-native-pdf-to-image' doesn't seem to be linked."
    );
    expect(() => module.convertB64('ZmFrZQ==', 512)).not.toThrow(
      "You have run 'pod install'"
    );
  });
});
