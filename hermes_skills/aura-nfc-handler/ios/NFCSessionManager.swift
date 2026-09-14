// NFCSessionManager.swift
// Minimal CoreNFC session manager for NTAG216 reads/writes.
// Requires iOS 13+ and CoreNFC entitlement.
import Foundation
import CoreNFC
import CommonCrypto
class NFCSessionManager: NSObject, NFCTagReaderSessionDelegate {
private var session: NFCTagReaderSession?
var onRead: ((String, String, String) -> Void)? // uidHex, snapshotBase64, checksum
var onError: ((String) -> Void)?
func beginSession() {
guard NFCTagReaderSession.readingAvailable else {
onError?("NFC not available")
return
}
session = NFCTagReaderSession(pollingOption: .iso14443, delegate: self, queue: nil)
session?.alertMessage = "Hold your device near the Aura card."
session?.begin()
}
func tagReaderSession(_ session: NFCTagReaderSession, didInvalidateWithError error: Error) {
onError?(error.localizedDescription)
}
func tagReaderSession(_ session: NFCTagReaderSession, didDetect tags: [NFCTag]) {
guard let first = tags.first else { return }
session.connect(to: first) { (error) in
if let err = error {
self.onError?(err.localizedDescription)
return
}
switch first {
case .miFare(let mifareTag):
// Read pages using mifareTag
self.readNtag(mifareTag: mifareTag, session: session)
default:
self.onError?("Unsupported tag type")
}
}
}
private func readNtag(mifareTag: NFCMiFareTag, session: NFCTagReaderSession) {
// Example: read multiple blocks/pages; CoreNFC provides transceive for MiFare
var allData = Data()
let pagesToRead = 222
let dispatchGroup = DispatchGroup()
for page in stride(from: 0, to: pagesToRead, by: 4) {
dispatchGroup.enter()
let cmd: [UInt8] = [0x30, UInt8(page & 0xFF)]
let apdu = Data(cmd)
mifareTag.sendMiFareCommand(commandPacket: apdu) { (response, error) in
if let resp = response {
allData.append(resp)
}
dispatchGroup.leave()
}
}
dispatchGroup.notify(queue: .main) {
let uidHex = mifareTag.identifier.map { String(format: "%02X", $0) }.joined()
let snapshotBase64 = allData.base64EncodedString()
let checksum = self.sha256Base64(data: allData)
self.onRead?(uidHex, snapshotBase64, checksum)
session.invalidate()
}
}
private func sha256Base64(data: Data) -> String {
var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
data.withUnsafeBytes {
_ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
}
return Data(hash).base64EncodedString()
}
}
