import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-pdf-to-image' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const PdfToImage = NativeModules.PdfToImage
  ? NativeModules.PdfToImage
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function convert(uri: string): Promise<any[]> {
  return PdfToImage.convert(uri);
}
export function convertB64(base64Str: string, dpi: number): Promise<number> {
  return PdfToImage.convertB64(base64Str, dpi);
}
export function printPDF(
  ip: string,
  port: string,
  base64Str: string
): Promise<any[]> {
  return PdfToImage.printPDF(ip, port, base64Str);
}
