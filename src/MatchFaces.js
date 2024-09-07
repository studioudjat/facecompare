import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardMedia,
  Snackbar,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import AWS from "aws-sdk";
import Menu from "./Menu";
import { listImagesFromS3, renameProfileImage } from "./s3Service";

const MatchFaces = () => {
  const [images, setImages] = useState([]);
  const [targetKey, setTargetKey] = useState("");
  const [sourceImageUrl, setSourceImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    fetchImages();
    fetchProfileImage(); // プロフィール画像を取得
  }, []);

  // プロフィール画像の取得
  const fetchProfileImage = async () => {
    try {
      const s3 = new AWS.S3();
      const profileUrl = s3.getSignedUrl("getObject", {
        Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
        Key: "images/profile.jpg",
        Expires: 300,
      });
      setSourceImageUrl(profileUrl);
    } catch (err) {
      console.error("Failed to fetch profile image:", err);
    }
  };

  // images リストを取得し、profile.jpg を除外
  const fetchImages = async () => {
    try {
      const imageList = await listImagesFromS3();
      const filteredImages = imageList.filter(
        (image) => image.key !== "images/profile.jpg"
      );
      setImages(filteredImages);
    } catch (err) {
      console.error("Failed to fetch images:", err);
    }
  };

  const handleImageClick = (key) => {
    setTargetKey(key);
  };

  // 顔比較の処理
  const handleCompare = async () => {
    if (!targetKey) {
      setError("ターゲット画像が選択されていません");
      return;
    }

    setLoading(true);
    const rekognition = new AWS.Rekognition();

    const params = {
      SourceImage: {
        S3Object: {
          Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
          Name: "images/profile.jpg",
        },
      },
      TargetImage: {
        S3Object: {
          Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
          Name: targetKey,
        },
      },
      SimilarityThreshold: 0,
    };

    try {
      const response = await rekognition.compareFaces(params).promise();
      if (response.FaceMatches && response.FaceMatches.length > 0) {
        const matches = response.FaceMatches.map((match) => {
          return `Face is ${match.Similarity}% similar`;
        });
        setResult(matches.join(", "));
      } else {
        setResult("No faces matched.");
      }
    } catch (error) {
      setError("Error comparing faces: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Set as Source の処理
  const setAsSourceImage = async () => {
    setLoading(true);
    const timestamp = new Date().getTime();

    try {
      console.log("Step A: Calling renameProfileImage...");

      // プロフィール画像のリネームと新しい画像の設定
      await renameProfileImage(targetKey, timestamp);
      console.log("Step B: Profile image set successfully.");

      // プロフィール画像のURLを更新（タイムスタンプ付き）
      const newProfileImageUrl = `https://${process.env.REACT_APP_S3_BUCKET_NAME}.s3.${process.env.REACT_APP_AWS_REGION}.amazonaws.com/images/profile.jpg?t=${timestamp}`;

      // 短い遅延を追加して S3 の変更が反映される時間を確保
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSourceImageUrl(newProfileImageUrl);
      console.log("Step C: Profile image URL updated successfully.");

      // 画像リストを再取得して更新
      await fetchImages();

      // 成功メッセージを表示
      setSnackbarMessage("Profile image updated successfully");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (err) {
      console.error("Error setting image as source:", err.message);
      // エラーメッセージを表示
      setSnackbarMessage("Error updating profile image: " + err.message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
    <div>
      <Menu />
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

        {/* プロフィール画像を表示 */}
        <Box display="flex" justifyContent="center" marginBottom="30px">
          <Card>
            <CardMedia
              component="img"
              height="300"
              image={sourceImageUrl}
              alt="Source Image (Profile)"
            />
          </Card>
        </Box>

        {/* ターゲット画像の選択 */}
        <Typography variant="h6" align="center" gutterBottom>
          Select Target Image
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          {images.map((image) => (
            <Card
              key={image.key}
              onClick={() => handleImageClick(image.key)}
              style={{
                border:
                  targetKey === image.key
                    ? "3px solid #1976d2"
                    : "3px solid transparent",
                cursor: "pointer",
                width: "120px",
                height: "120px",
              }}
            >
              <CardMedia
                component="img"
                image={image.url}
                alt="Target Image"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Card>
          ))}
        </Box>

        {/* Match Faces ボタン */}
        <Box display="flex" justifyContent="center" marginTop="10px">
          <Button
            variant="contained"
            color="primary"
            onClick={handleCompare}
            disabled={!targetKey || loading}
          >
            {loading ? "Comparing..." : "Match Faces"}
          </Button>
        </Box>

        {/* Set as Source ボタン */}
        <Box display="flex" justifyContent="center" marginTop="10px">
          <Button
            variant="contained"
            color="secondary"
            onClick={setAsSourceImage}
            disabled={!targetKey || loading}
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

        {error && (
          <Typography
            variant="h6"
            align="center"
            style={{ marginTop: "20px", color: "red" }}
          >
            {error}
          </Typography>
        )}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <MuiAlert
            onClose={handleCloseSnackbar}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </MuiAlert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default MatchFaces;
