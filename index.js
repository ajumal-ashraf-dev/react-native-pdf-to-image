import { NativeModules } from 'react-native';

const { RNPdfToImage } = NativeModules;

export default {
  convert: RNPdfToImage.convert,
  convertB64: RNPdfToImage.convertB64,
  printPDF: RNPdfToImage.printPDF
};
