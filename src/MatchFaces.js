import React, { useState, useEffect } from "react";
import AWS from "aws-sdk";
import {
  Container,
  Typography,
  Button,
  Card,
  CardMedia,
  Box,
} from "@mui/material";
import Menu from "./Menu";

const MatchFaces = () => {
  const [images, setImages] = useState([]);
  const [sourceKey, setSourceKey] = useState("profile.jpg");
  const [sourceImageUrl, setSourceImageUrl] = useState(null); // プロフィール画像のURL
  const [targetKey, setTargetKey] = useState("");
  const [result, setResult] = useState(null);
  const [similarity, setSimilarity] = useState(null); // 類似度スコア
  const [error, setError] = useState(null); // エラーメッセージ用の状態
  const [loading, setLoading] = useState(false); // ローディング状態の設定

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = () => {
    // AWS SDKの設定
    AWS.config.update({
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
      region: process.env.REACT_APP_AWS_REGION,
    });

    const s3 = new AWS.S3();
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME, // S3バケット名を.envから取得
    };

    s3.listObjectsV2(params, (err, data) => {
      if (err) {
        console.error("Error fetching images:", err);
        setError("Could not fetch images from S3");
      } else {
        const imageUrls = data.Contents.filter(
          (item) => item.Key !== "profile.jpg"
        ).map((item) => {
          const signedUrl = s3.getSignedUrl("getObject", {
            Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
            Key: item.Key,
            Expires: 300,
          });
          return { key: item.Key, url: signedUrl };
        });
        setImages(imageUrls);

        // profile.jpg のURLを取得
        const profileUrl = s3.getSignedUrl("getObject", {
          Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
          Key: "profile.jpg",
          Expires: 300,
        });
        setSourceImageUrl(profileUrl);
      }
    });
  };

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

  // プロフィール画像を変更する処理
  const setAsSourceImage = async () => {
    setLoading(true); // ローディング中の設定

    const s3 = new AWS.S3();
    const timestamp = new Date().getTime(); // タイムスタンプを生成

    // profile.jpg のファイル名を変更
    const renameParams = {
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
      CopySource: `${process.env.REACT_APP_S3_BUCKET_NAME}/profile.jpg`,
      Key: `profile_${timestamp}.jpg`,
    };

    try {
      // まずprofile.jpgをタイムスタンプ付きのファイル名にコピー
      await s3.copyObject(renameParams).promise();

      // コピーが完了したら、元のprofile.jpgを削除
      await s3
        .deleteObject({
          Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
          Key: "profile.jpg",
        })
        .promise();

      // 新しいファイルをprofile.jpgとしてコピー
      await s3
        .copyObject({
          Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
          CopySource: `${process.env.REACT_APP_S3_BUCKET_NAME}/${targetKey}`,
          Key: "profile.jpg",
        })
        .promise();

      setSourceKey("profile.jpg"); // 新しいソース画像をprofile.jpgに設定
      setSourceImageUrl(
        s3.getSignedUrl("getObject", {
          Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
          Key: "profile.jpg",
          Expires: 300,
        })
      );

      // ターゲット画像を削除
      await s3
        .deleteObject({
          Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
          Key: targetKey,
        })
        .promise();

      fetchImages(); // 画像リストを再度取得して更新
      setError(null); // エラーをクリア
    } catch (err) {
      console.error("Error setting as source image:", err);
      setError("Error setting image as source");
    } finally {
      setLoading(false); // ローディングを解除
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
          Compare Faces
        </Typography>

        {/* Flexboxレイアウトに変更 */}
        <Box
          display="flex"
          justifyContent="center"
          alignItems="flex-start"
          gap={4}
          flexWrap="wrap"
        >
          {/* ソース画像 */}
          <Box flex="1 1 300px">
            <Card>
              <CardMedia
                component="img"
                height="300"
                image={sourceImageUrl}
                alt="Source Image (Profile)"
              />
            </Card>
          </Box>

          {/* ターゲット画像選択 */}
          <Box flex="1 1 300px">
            <Typography variant="h6" align="center" gutterBottom>
              Select Target Image
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              {images.map((image) => (
                <Card
                  key={image.key}
                  onClick={() => setTargetKey(image.key)}
                  style={{
                    border:
                      targetKey === image.key
                        ? "3px solid #1976d2"
                        : "3px solid transparent",
                    cursor: "pointer",
                    width: "120px", // カードの幅を固定
                    height: "120px", // カードの高さを固定
                  }}
                >
                  <CardMedia
                    component="img"
                    image={image.url}
                    alt="Target Image"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover", // 縦横比を保ちながら画像をカバー
                    }}
                  />
                </Card>
              ))}
            </Box>
          </Box>
        </Box>

        {/* ボタン群 */}
        <Box display="flex" justifyContent="center" marginTop="30px" gap={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCompare}
            disabled={!targetKey}
            style={{ textTransform: "none" }}
          >
            Match Faces
          </Button>

          <Button
            variant="contained"
            color="secondary"
            onClick={setAsSourceImage}
            disabled={!targetKey || loading}
            style={{ textTransform: "none" }}
          >
            {loading ? "Processing..." : "Set as Source"}
          </Button>
        </Box>

        {/* 結果表示 */}
        {result && (
          <Typography
            variant="h6"
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

export default MatchFaces;
