import fs from "fs";
import path from "path";

class FileService {
  constructor() {
    this.uploadsDir = path.join(process.cwd(), "uploads");
    this.ensureUploadsDirectory();
  }

  // Ensure uploads directory exists
  ensureUploadsDirectory() {
    if (!fs.existsSync(this.uploadsDir)) {
      try {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      } catch (error) {
        console.error("Error creating uploads directory:", error);
      }
    }
  }

  // Save base64 attachments to disk
  async saveBase64AttachmentsToDisk(attachmentsBase64 = [], prefix = "file") {
    const savedPaths = [];

    for (let i = 0; i < attachmentsBase64.length; i++) {
      const b64 = attachmentsBase64[i];
      if (!b64 || typeof b64 !== "string") continue;

      // Detect mime from data URL if provided
      let ext = "bin";
      const match = b64.match(/^data:(.+);base64,(.*)$/);
      let data = b64;

      if (match) {
        const mime = match[1] || "";
        data = match[2] || "";
        if (mime.includes("png")) ext = "png";
        else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
        else if (mime.includes("pdf")) ext = "pdf";
        else if (mime.includes("gif")) ext = "gif";
        else if (mime.includes("webp")) ext = "webp";
        else if (mime.includes("bmp")) ext = "bmp";
        else if (mime.includes("svg")) ext = "svg";
      }

      const fileName = `${prefix}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const filePath = path.join(this.uploadsDir, fileName);

      try {
        fs.writeFileSync(filePath, Buffer.from(data, "base64"));
        savedPaths.push(`/uploads/${fileName}`);
      } catch (error) {
        console.error("Error saving file:", error);
        // Continue with other files even if one fails
      }
    }

    return savedPaths;
  }

  // Delete file from disk
  deleteFile(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  // Check if file exists
  fileExists(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      return fs.existsSync(fullPath);
    } catch (error) {
      return false;
    }
  }

  // Get file stats
  getFileStats(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      return fs.statSync(fullPath);
    } catch (error) {
      return null;
    }
  }
}

export default FileService;
