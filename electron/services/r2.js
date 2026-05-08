const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

async function uploadScreenshot(localFilePath, sessionId, index) {
  const key = `sessions/${sessionId}/screenshot_${String(index).padStart(3, '0')}.jpg`
  const fileBuffer = fs.readFileSync(localFilePath)

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: 'image/jpeg',
  }))

  fs.unlinkSync(localFilePath)

  return `${process.env.R2_PUBLIC_URL}/${key}`
}

module.exports = { uploadScreenshot }
