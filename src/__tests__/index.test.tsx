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
    const result = { outputFiles: ['cache/output.png'] };

    NativeModules.PdfToImage.convert.mockResolvedValueOnce(result);

    await expect(module.convert('file:///tmp/input.pdf')).resolves.toEqual(result);
    expect(NativeModules.PdfToImage.convert).toHaveBeenCalledWith(
      'file:///tmp/input.pdf'
    );
    expect(module.default.convert).toBe(module.convert);
    expect(module.default.convertB64).toBe(module.convertB64);
    expect(module.default.printPDF).toBe(module.printPDF);
  });
});
