import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from 'axios';
import { AWS_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME } from '../config/env.js';
import https from 'https'; 
import path from 'path';

// AWS S3 클라이언트 인스턴스를 설정합니다.
const s3Client = new S3Client({
  region: AWS_S3_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

// 이미지 URL을 받아 S3에 업로드하고 업로드된 이미지 URL을 반환하는 함수
const uploadImageToS3 = async (imageUrl, title) => {
  try {
    // 이미지 URL에서 이미지를 버퍼로 다운로드합니다.
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'arraybuffer',
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false  // 인증서 검증을 비활성화합니다.
      })
    });
    const buffer = Buffer.from(response.data, 'binary');

    // 파일 확장자를 URL에서 추출합니다.
    const extension = path.extname(new URL(imageUrl).pathname);
    
    const randomNumber = Math.floor(Math.random() * 1e8).toString().padStart(8, '0');
    const filename = `masterkey/${title}_${randomNumber}${extension}`;
    
    // S3에 업로드합니다.
    const putObjectCommand = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ACL: 'public-read', // 파일을 공개적으로 접근 가능하게 할 경우
      ContentType: 'image/jpeg' // 적절한 MIME 타입 설정
    });

    await s3Client.send(putObjectCommand);

    // 업로드된 이미지의 S3 URL을 생성합니다.
    const uploadedImageUrl  = `https://${AWS_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${filename}`;

    // 업로드된 이미지의 URL을 반환합니다.
    return uploadedImageUrl ;
  } catch (error) {
    console.error('There was an error uploading the image to S3', error);
    throw new Error('Error uploading image to S3');
  }
};

export default uploadImageToS3;
