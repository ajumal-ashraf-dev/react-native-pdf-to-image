#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PdfToImage, NSObject)

RCT_EXTERN_METHOD(convert:(NSString *)pdfUriString
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(convertB64:(NSString *)base64String
                  withDpi:(nonnull NSNumber *)dpi
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(printPDF:(NSString *)ipAddress
                  withPort:(nonnull NSNumber *)portNumber
                  withBase64Str:(NSString *)base64Str
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
