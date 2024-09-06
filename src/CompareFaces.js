import React, { useState } from "react";
import AWS from "aws-sdk";
import {
  Container,
  Typography,
  Button,
  Card,
  CardMedia,
  Box,
  TextField,
  CircularProgress,
} from "@mui/material";
import Menu from "./Menu";

const CompareFaces = () => {
  const [sourceFile, setSourceFile] = useState(null); // ソース画像のファイル
  const [targetFile, setTargetFile] = useState(null); // ターゲット画像のファイル
  const [sourceImageUrl, setSourceImageUrl] = useState(null); // アップロード後のソース画像URL
  const [targetImageUrl, setTargetImageUrl] = useState(null); // アップロード後のターゲット画像URL
  const [sourceKey, setSourceKey] = useState(null); // S3のソース画像のキー
  const [targetKey, setTargetKey] = useState(null); // S3のターゲット画像のキー
  const [result, setResult] = useState(null); // 比較結果
  const [similarity, setSimilarity] = useState(null); // 類似度スコア
  const [error, setError] = useState(null); // エラーメッセージ
  const [uploading, setUploading] = useState(false); // アップロード中フラグ

  // AWS SDKの設定
  AWS.config.update({
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    region: process.env.REACT_APP_AWS_REGION,
  });

  // 画像をS3にアップロードする処理
  const uploadToS3 = (file) => {
    return new Promise((resolve, reject) => {
      const s3 = new AWS.S3();
      const params = {
        Bucket: process.env.REACT_APP_S3_BUCKET_NAME, // S3バケット名
        Key: file.name, // ファイル名をキーとして使用
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

  // アップロード処理を実行
  const handleUpload = async () => {
    setUploading(true);
    try {
      const sourceImageData = await uploadToS3(sourceFile);
      const targetImageData = await uploadToS3(targetFile);

      setSourceKey(sourceImageData.key);
      setTargetKey(targetImageData.key);
      setSourceImageUrl(sourceImageData.url);
      setTargetImageUrl(targetImageData.url);

      setError(null); // エラーをクリア
    } catch (err) {
      console.error("Error uploading images:", err);
      setError("Error uploading images");
    } finally {
      setUploading(false);
    }
  };

  // Rekognitionで顔を比較する処理
  const handleCompare = async () => {
    const rekognition = new AWS.Rekognition();
    const params = {
      SourceImage: {
        S3Object: {
          Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
          Name: sourceKey,
        },
      },
      TargetImage: {
        S3Object: {
          Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
          Name: targetKey,
        },
      },
      SimilarityThreshold: 0, // 類似度の閾値を設定
    };

    try {
      const response = await rekognition.compareFaces(params).promise();

      if (response.FaceMatches && response.FaceMatches.length > 0) {
        const matches = response.FaceMatches.map((match) => {
          return `Face is ${match.Similarity}% similar`;
        });
        setResult(matches.join(", "));
        setSimilarity(null); // マッチした場合は類似度スコアをクリア
      } else {
        setResult("No faces matched.");
        setSimilarity(0); // 類似度スコアを設定
      }
    } catch (error) {
      console.error("Error comparing faces:", error);
      setError(`Error comparing faces: ${error.message}`);
    }
  };

  return (
    <div>
      <Menu /> {/* メニューを表示 */}
      <Container maxWidth="md" style={{ marginTop: "100px" }}>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          style={{
            fontWeight: "bold",
            color: "#1976d2",
            textTransform: "uppercase",
            letterSpacing: "2px",
            borderBottom: "2px solid #1976d2",
            paddingBottom: "10px",
            marginBottom: "30px",
          }}
        >
          Upload and Compare Faces
        </Typography>

        {/* 画像アップロードフォーム */}
        <Box display="flex" justifyContent="space-around" marginBottom="30px">
          <TextField
            type="file"
            onChange={(e) => setSourceFile(e.target.files[0])}
            label="Upload Source Image"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="file"
            onChange={(e) => setTargetFile(e.target.files[0])}
            label="Upload Target Image"
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        {/* アップロードボタン */}
        <Box display="flex" justifyContent="center" marginBottom="30px">
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!sourceFile || !targetFile || uploading}
            style={{ textTransform: "none" }}
          >
            {uploading ? <CircularProgress size={24} /> : "Upload Images"}
          </Button>
        </Box>

        {/* アップロードした画像のプレビュー */}
        {sourceImageUrl && targetImageUrl && (
          <Box display="flex" justifyContent="space-around" marginBottom="30px">
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={sourceImageUrl}
                alt="Source Image"
              />
            </Card>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={targetImageUrl}
                alt="Target Image"
              />
            </Card>
          </Box>
        )}

        {/* マッチングボタン */}
        <Box display="flex" justifyContent="center" marginBottom="30px">
          <Button
            variant="contained"
            color="primary"
            onClick={handleCompare}
            disabled={!sourceKey || !targetKey || uploading}
            style={{ textTransform: "none" }}
          >
            Compare Faces
          </Button>
        </Box>

        {/* 結果表示 */}
        {result && (
          <Typography
            variant="h6

"
            align="center"
            style={{ marginTop: "20px", color: "green" }}
          >
            {result}
          </Typography>
        )}

        {similarity !== null && (
          <Typography
            variant="h6"
            align="center"
            style={{ marginTop: "20px", color: "orange" }}
          >
            Highest similarity: {similarity}%
          </Typography>
        )}

        {error && (
          <Typography
            variant="h6"
            align="center"
            style={{ marginTop: "20px", color: "red" }}
          >
            {error}
          </Typography>
        )}
      </Container>
    </div>
  );
};

export default CompareFaces;
