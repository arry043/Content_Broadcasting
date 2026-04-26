const { S3Client } = require('@aws-sdk/client-s3');

let s3Client = null;

if (process.env.USE_S3 === 'true') {
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

module.exports = s3Client;
