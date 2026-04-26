const fs = require('fs');
const path = require('path');
const s3Client = require('../config/s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

exports.deleteFile = async (fileUrl) => {
  if (!fileUrl) return;

  const useS3 = process.env.USE_S3 === 'true';

  if (useS3 && s3Client && fileUrl.includes('s3.amazonaws.com')) {
    try {
      const urlParts = fileUrl.split('/');
      const key = `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`; // e.g. 'content/uuid.jpg'
      
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: decodeURIComponent(key),
      }));
    } catch (err) {
      console.error('S3 Delete Error:', err);
    }
  } else {
    try {
      // Local delete
      // fileUrl is like /uploads/content/filename.jpg
      const filePath = path.join(__dirname, '../../', fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Local File Delete Error:', err);
    }
  }
};
