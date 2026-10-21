import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

struct PortraitCrop {
    let name: String
    let x: Int
    let width: Int
}

let sourcePath = "dist/assets/characters/team-lineup-corporate-v4.png"
let outputDirectory = "dist/assets/characters/cast-v4"
let crops = [
    PortraitCrop(name: "expert", x: 0, width: 230),
    PortraitCrop(name: "project", x: 220, width: 230),
    PortraitCrop(name: "course", x: 440, width: 230),
    PortraitCrop(name: "case", x: 660, width: 230),
    PortraitCrop(name: "activity", x: 885, width: 230),
    PortraitCrop(name: "quiz", x: 1105, width: 230),
    PortraitCrop(name: "evaluation", x: 1325, width: 230),
    PortraitCrop(name: "copy", x: 1544, width: 230),
]

let sourceURL = URL(fileURLWithPath: sourcePath)
guard let source = CGImageSourceCreateWithURL(sourceURL as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    fatalError("Unable to read source image")
}

try FileManager.default.createDirectory(
    atPath: outputDirectory,
    withIntermediateDirectories: true
)

for crop in crops {
    let rect = CGRect(x: crop.x, y: 0, width: crop.width, height: image.height)
    guard let portrait = image.cropping(to: rect) else {
        fatalError("Unable to crop \(crop.name)")
    }
    let outputURL = URL(fileURLWithPath: "\(outputDirectory)/\(crop.name).png")
    guard let destination = CGImageDestinationCreateWithURL(
        outputURL as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
    ) else {
        fatalError("Unable to create \(crop.name)")
    }
    CGImageDestinationAddImage(destination, portrait, nil)
    guard CGImageDestinationFinalize(destination) else {
        fatalError("Unable to save \(crop.name)")
    }
}
