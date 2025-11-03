#!/usr/bin/env node

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

(async () => {
    console.log('\n🔍 Searching ALL S3 locations for MP4 files...\n');
    console.log('Bucket:', process.env.S3_BUCKET);
    console.log('');

    // Check ALL possible locations
    const locations = [
        'downloads/',
        'downloads/channel1/',
        'downloads/channel1/program/',
        'recordings/',
        'recordings/channel1/',
        'recordings/channel1/program/',
        'medialive/',
        ''  // root - check everything
    ];

    for (const prefix of locations) {
        try {
            const cmd = new ListObjectsV2Command({
                Bucket: process.env.S3_BUCKET,
                Prefix: prefix,
                MaxKeys: 1000
            });

            const response = await s3.send(cmd);

            if (response.Contents) {
                const mp4Files = response.Contents.filter(f => f.Key.endsWith('.mp4'));
                if (mp4Files.length > 0) {
                    console.log('📁 ' + (prefix || '(root)'));
                    mp4Files.forEach(f => {
                        const sizeMB = (f.Size / 1024 / 1024).toFixed(2);
                        const date = new Date(f.LastModified).toLocaleString('en-AU');
                        console.log(`   • ${f.Key}`);
                        console.log(`     ${sizeMB} MB - ${date}`);
                    });
                    console.log('');
                }
            }
        } catch (err) {
            console.error(`Error checking ${prefix}:`, err.message);
        }
    }

    console.log('✅ Search complete.\n');
})();
