import Foundation
import UIKit

@objc(PdfToImage)
class PdfToImage: NSObject {
  private let convertError = "E_CONVERT_ERROR"
  private let printError = "E_PRINT_ERROR"

  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(convert:withResolver:withRejecter:)
  func convert(
    _ pdfUriString: String,
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    do {
      let pdfURL = try resolvePdfURL(from: pdfUriString)
      let outputFiles = try renderPdf(at: pdfURL, targetWidth: nil)
      resolve(["outputFiles": outputFiles])
    } catch {
      reject(convertError, error.localizedDescription, error)
    }
  }

  @objc(convertB64:withDpi:withResolver:withRejecter:)
  func convertB64(
    _ base64String: String,
    dpi: NSNumber,
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    do {
      let pdfURL = try writeBase64PdfToTempFile(base64String)
      defer { try? FileManager.default.removeItem(at: pdfURL) }

      let outputFiles = try renderPdf(at: pdfURL, targetWidth: CGFloat(truncating: dpi))
      resolve(["outputFiles": outputFiles])
    } catch {
      reject(convertError, error.localizedDescription, error)
    }
  }

  @objc(printPDF:withPort:withBase64Str:withResolver:withRejecter:)
  func printPDF(
    _ ipAddress: String,
    portNumber: NSNumber,
    base64Str: String,
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    do {
      let pdfData = try decodeBase64Pdf(base64Str)
      try send(data: pdfData, to: ipAddress, port: UInt32(truncating: portNumber))
      resolve(1)
    } catch {
      reject(printError, error.localizedDescription, error)
    }
  }

  private func resolvePdfURL(from uriString: String) throws -> URL {
    if let url = URL(string: uriString), url.isFileURL {
      return url
    }

    let path = (uriString as NSString).expandingTildeInPath
    if FileManager.default.fileExists(atPath: path) {
      return URL(fileURLWithPath: path)
    }

    throw PdfToImageError.invalidUri
  }

  private func writeBase64PdfToTempFile(_ base64String: String) throws -> URL {
    let pdfData = try decodeBase64Pdf(base64String)
    let tempURL = FileManager.default.temporaryDirectory
      .appendingPathComponent(UUID().uuidString)
      .appendingPathExtension("pdf")

    try pdfData.write(to: tempURL, options: .atomic)
    return tempURL
  }

  private func decodeBase64Pdf(_ base64String: String) throws -> Data {
    if let data = Data(base64Encoded: base64String, options: [.ignoreUnknownCharacters]) {
      return data
    }

    throw PdfToImageError.invalidBase64
  }

  private func renderPdf(at pdfURL: URL, targetWidth: CGFloat?) throws -> [String] {
    guard let document = CGPDFDocument(pdfURL as CFURL) else {
      throw PdfToImageError.unreadablePdf
    }

    let pageCount = document.numberOfPages
    guard pageCount > 0 else {
      return []
    }

    let cacheDirectory = try cacheDirectoryURL()
    var outputFiles: [String] = []

    for pageIndex in 1...pageCount {
      guard let page = document.page(at: pageIndex) else {
        throw PdfToImageError.pageLoadFailed(pageIndex)
      }

      let image = try renderPage(page, targetWidth: targetWidth)
      let outputURL = cacheDirectory
        .appendingPathComponent("\(Int(Date().timeIntervalSince1970 * 1000))-\(pageIndex)_pdf.png")

      guard let pngData = image.pngData() else {
        throw PdfToImageError.imageEncodingFailed
      }

      try pngData.write(to: outputURL, options: .atomic)
      outputFiles.append(outputURL.path)
    }

    return outputFiles
  }

  private func renderPage(_ page: CGPDFPage, targetWidth: CGFloat?) throws -> UIImage {
    let pageRect = page.getBoxRect(.mediaBox)
    guard pageRect.width > 0, pageRect.height > 0 else {
      throw PdfToImageError.invalidPageSize
    }

    let width = max(targetWidth ?? pageRect.width, 1)
    let scale = width / pageRect.width
    let height = max(pageRect.height * scale, 1)
    let outputSize = CGSize(width: width, height: height)

    let renderer = UIGraphicsImageRenderer(size: outputSize)
    return renderer.image { context in
      UIColor.white.setFill()
      context.fill(CGRect(origin: .zero, size: outputSize))

      let cgContext = context.cgContext
      cgContext.saveGState()
      cgContext.translateBy(x: 0, y: outputSize.height)
      cgContext.scaleBy(x: scale, y: -scale)
      cgContext.drawPDFPage(page)
      cgContext.restoreGState()
    }
  }

  private func cacheDirectoryURL() throws -> URL {
    guard let cacheURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first else {
      throw PdfToImageError.cacheDirectoryUnavailable
    }

    return cacheURL
  }

  private func send(data: Data, to host: String, port: UInt32) throws {
    var readStream: Unmanaged<CFReadStream>?
    var writeStream: Unmanaged<CFWriteStream>?

    CFStreamCreatePairWithSocketToHost(nil, host as CFString, port, &readStream, &writeStream)

    guard let outputStream = writeStream?.takeRetainedValue() else {
      throw PdfToImageError.connectionFailed
    }

    outputStream.open()
    defer {
      outputStream.close()
      readStream?.release()
    }

    if let streamError = outputStream.streamError {
      throw streamError
    }

    try data.withUnsafeBytes { rawBuffer in
      guard let baseAddress = rawBuffer.bindMemory(to: UInt8.self).baseAddress else {
        throw PdfToImageError.connectionFailed
      }

      var bytesRemaining = data.count
      var offset = 0

      while bytesRemaining > 0 {
        let written = outputStream.write(baseAddress.advanced(by: offset), maxLength: bytesRemaining)

        if written < 0 {
          throw outputStream.streamError ?? PdfToImageError.connectionFailed
        }

        if written == 0 {
          throw PdfToImageError.connectionClosed
        }

        bytesRemaining -= written
        offset += written
      }
    }
  }
}

private enum PdfToImageError: LocalizedError {
  case cacheDirectoryUnavailable
  case connectionClosed
  case connectionFailed
  case imageEncodingFailed
  case invalidBase64
  case invalidPageSize
  case invalidUri
  case pageLoadFailed(Int)
  case unreadablePdf

  var errorDescription: String? {
    switch self {
    case .cacheDirectoryUnavailable:
      return "Unable to access the caches directory."
    case .connectionClosed:
      return "The socket connection closed before all PDF data was sent."
    case .connectionFailed:
      return "Unable to open a socket connection to the target printer."
    case .imageEncodingFailed:
      return "Unable to encode the rendered PDF page as a PNG image."
    case .invalidBase64:
      return "The supplied base64 PDF payload is invalid."
    case .invalidPageSize:
      return "Encountered a PDF page with an invalid size."
    case .invalidUri:
      return "The supplied PDF URI is invalid or unsupported on iOS."
    case .pageLoadFailed(let pageIndex):
      return "Unable to load PDF page \(pageIndex)."
    case .unreadablePdf:
      return "Unable to open the PDF document."
    }
  }
}
