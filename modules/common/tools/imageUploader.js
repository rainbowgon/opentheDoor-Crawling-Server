import AWS from 'aws-sdk'
import multerS3 from 'multer-s3';
import multer from 'multer';
import path from 'path';
import { AWS_S3_REGION,AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME } from '../config/env.js';

  const s3 = new aws.S3({
    region         : AWS_S3_REGION,
    accessKeyId    : AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

// 확장자 검사 목록
const allowedExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.gif'];

// multer 객체 생성
const uploadImage = multer({
    storage: multerS3({
        s3         : s3,
        bucket     : AWS_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key        : (req, file, callback) => {
            const userId = req.verifiedToken.userInfo;
            
            // 오늘 날짜 구하기
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;
            const currentDate = today.getDate();
            const date = `${currentYear}-${currentMonth}-${currentDate}`;
            
            // 임의번호 생성
            let randomNumber = '';
            for (let i = 0; i < 8; i++) {
                randomNumber += String(Math.floor(Math.random() * 10));
            }
            
            // 확장자 검사
            const extension = path.extname(file.originalname).toLowerCase();
            if (!allowedExtensions.includes(extension)) {
                return callback(new Error('확장자 에러'));
            }
            
            // folder라는 파일 내부에 업로드한 사용자에 따라 임의의 파일명으로 저장
            callback(null, `folder/${userId}_${date}_${randomNumber}`);
        },
        // acl 권한 설정
        acl        : 'public-read-write'
    }),
    // 이미지 용량 제한 (5MB)
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});