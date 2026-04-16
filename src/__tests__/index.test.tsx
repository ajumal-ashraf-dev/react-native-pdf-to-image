jest.mock('react-native', () => ({
  NativeModules: {
    PdfToImage: {
      convert: jest.fn(),
      convertB64: jest.fn(),
      printPDF: jest.fn(),
    },
  },
  Platform: {
    select: ({ ios, default: defaultValue }: { ios?: string; default?: string }) =>
      ios ?? defaultValue,
  },
}));

describe('react-native-pdf-to-image', () => {
  it('exposes the native module methods through named and default exports', async () => {
    const module = require('../index');
    const { NativeModules } = require('react-native');
    const convertResult = { outputFiles: ['cache/output.png'] };
    const convertB64Result = { outputFiles: ['cache/output-1.png', 'cache/output-2.png'] };

    NativeModules.PdfToImage.convert.mockResolvedValueOnce(convertResult);
    NativeModules.PdfToImage.convertB64.mockResolvedValueOnce(convertB64Result);
    NativeModules.PdfToImage.printPDF.mockResolvedValueOnce(1);

    await expect(module.convert('file:///tmp/input.pdf')).resolves.toEqual(
      convertResult
    );
    expect(NativeModules.PdfToImage.convert).toHaveBeenCalledWith(
      'file:///tmp/input.pdf'
    );

    await expect(module.convertB64('ZmFrZQ==', 1024)).resolves.toEqual(
      convertB64Result
    );
    expect(NativeModules.PdfToImage.convertB64).toHaveBeenCalledWith(
      'ZmFrZQ==',
      1024
    );

    await expect(
      module.printPDF('192.168.0.10', 9100, 'ZmFrZQ==')
    ).resolves.toBe(1);
    expect(NativeModules.PdfToImage.printPDF).toHaveBeenCalledWith(
      '192.168.0.10',
      9100,
      'ZmFrZQ=='
    );

    expect(module.default.convert).toBe(module.convert);
    expect(module.default.convertB64).toBe(module.convertB64);
    expect(module.default.printPDF).toBe(module.printPDF);
  });
});
