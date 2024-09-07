import AWS from "aws-sdk";

AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION,
});

const s3 = new AWS.S3();

// 画像リストをS3から取得
export const listImagesFromS3 = async () => {
  const params = {
    Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
    Prefix: "images/", // 画像が保存されているディレクトリ
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    return data.Contents.map((item) => ({
      key: item.Key,
      url: s3.getSignedUrl("getObject", {
        Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
        Key: item.Key,
        Expires: 3600,
      }),
    }));
  } catch (err) {
    console.error("Error fetching images from S3:", err);
    throw new Error("Error fetching images from S3");
  }
};

export const uploadToS3 = (file) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
      Key: `images/${file.name}`,
      Body: file,
      ContentType: file.type,
    };

    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          key: data.Key,
          url: s3.getSignedUrl("getObject", {
            Bucket: params.Bucket,
            Key: data.Key,
            Expires: 3600,
          }),
        });
      }
    });
  });
};

export const renameProfileImage = async (targetKey, timestamp) => {
  const oldProfileKey = "images/profile.jpg";
  const newProfileKey = `images/profile_${timestamp}.jpg`;

  try {
    console.log("Step 1: Renaming old profile image...");

    // 古いprofile.jpgをタイムスタンプ付きのファイル名にコピー
    await s3
      .copyObject({
        Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
        CopySource: `${process.env.REACT_APP_S3_BUCKET_NAME}/${oldProfileKey}`,
        Key: newProfileKey,
      })
      .promise();
    console.log(`Old profile.jpg renamed to ${newProfileKey}`);

    // 古いprofile.jpgを削除
    await s3
      .deleteObject({
        Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
        Key: oldProfileKey,
      })
      .promise();
    console.log("Old profile.jpg deleted successfully.");

    // 選択された新しい画像をprofile.jpgにコピー
    await s3
      .copyObject({
        Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
        CopySource: `${process.env.REACT_APP_S3_BUCKET_NAME}/${targetKey}`,
        Key: oldProfileKey,
      })
      .promise();
    console.log("New profile image set successfully.");

    // 元の選択された画像を削除（オプション）
    // もし元の画像を保持したい場合は、この部分をコメントアウトしてください
    await s3
      .deleteObject({
        Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
        Key: targetKey,
      })
      .promise();
    console.log("Original selected image deleted.");
  } catch (err) {
    console.error("Error during renameProfileImage:", err.message);
    throw new Error(`Error renaming profile image: ${err.message}`);
  }
};

/*export const deleteOldProfileImage = async (oldProfileImageKey) => {
  const s3 = new AWS.S3();

  const params = {
    Bucket: process.env.REACT_APP_S3_BUCKET_NAME, // S3バケット名
    Key: oldProfileImageKey, // 削除する古い画像のキー
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`Deleted old profile image: ${oldProfileImageKey}`);
  } catch (error) {
    console.error(`Error deleting old profile image: ${error.message}`);
    throw error;
  }
};*/
