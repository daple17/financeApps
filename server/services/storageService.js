const fs = require('fs');
const path = require('path');

class StorageService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 'local';
    console.log('[StorageService] Initialized with provider:', this.provider);
  }

  async uploadFile(file) {
    console.log('[StorageService] uploadFile called, provider is', this.provider);
    if (this.provider === 's3') {
      if (!process.env.AWS_S3_BUCKET || !process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('S3 Configuration is missing required environment variables.');
      }
      
      // Stub for S3 implementation. 
      // If S3 was fully implemented, we would use AWS SDK to upload the file buffer here.
      throw new Error('S3 Storage provider is configured but not fully implemented. Please implement AWS SDK logic or switch to local storage.');
    }

    // Default: local filesystem
    // Multer has already saved the file to local disk (e.g. server/uploads/operations)
    // We just return the relative path that the database expects.
    return file.path.replace('uploads/', '').replace('uploads\\', ''); // cross-platform replace
  }

  async deleteFile(filePath) {
    if (this.provider === 's3') {
      if (!process.env.AWS_S3_BUCKET) {
        throw new Error('S3 Configuration missing.');
      }
      throw new Error('S3 Storage provider delete not implemented.');
    }

    // Default: local filesystem
    const absolutePath = path.join(__dirname, '..', 'uploads', filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }
}

module.exports = new StorageService();
