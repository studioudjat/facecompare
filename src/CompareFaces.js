import React, { useState } from "react";
import AWS from "aws-sdk";
import {
  Container,
  Typography,
  Button,
  Card,
  CardMedia,
  Box,
  CircularProgress,
  Snackbar,
  Backdrop,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Menu from "./Menu";

const CompareFaces = () => {
  const [sourceFile, setSourceFile] = useState(null);
  const [targetFile, setTargetFile] = useState(null);
  const [sourceImageUrl, setSourceImageUrl] = useState(null);
  const [targetImageUrl, setTargetImageUrl] = useState(null);
  const [sourceKey, setSourceKey] = useState(null);
  const [targetKey, setTargetKey] = useState(null);
  const [result, setResult] = useState(null);
  const [similarity, setSimilarity] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // AWS SDKの設定
  AWS.config.update({
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    region: process.env.REACT_APP_AWS_REGION,
  });

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const handleFileChange = (event, isSource) => {
    const file = event.target.files[0];
    if (isSource) {
      setSourceFile(file);
      setSourceImageUrl(URL.createObjectURL(file));
    } else {
      setTargetFile(file);
      setTargetImageUrl(URL.createObjectURL(file));
    }
  };

  // 画像をS3にアップロードする処理
  const uploadToS3 = (file) => {
    return new Promise((resolve, reject) => {
      const s3 = new AWS.S3();
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

  // アップロード処理を実行
  const handleUpload = async () => {
    if (!sourceFile || !targetFile) {
      showSnackbar("Please select both source and target images", "error");
      return;
    }

    setUploading(true);
    try {
      const sourceImageData = await uploadToS3(sourceFile);
      const targetImageData = await uploadToS3(targetFile);

      setSourceKey(sourceImageData.key);
      setTargetKey(targetImageData.key);
      setSourceImageUrl(sourceImageData.url);
      setTargetImageUrl(targetImageData.url);

      setError(null);
      showSnackbar("Images uploaded successfully", "success");
    } catch (err) {
      console.error("Error uploading images:", err);
      setError("Error uploading images");
      showSnackbar("Error uploading images", "error");
    } finally {
      setUploading(false);
    }
  };

  // Rekognitionで顔を比較する処理
  const handleCompare = async () => {
    setComparing(true);
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
      SimilarityThreshold: 0,
    };

    try {
      const response = await rekognition.compareFaces(params).promise();

      if (response.FaceMatches && response.FaceMatches.length > 0) {
        const matches = response.FaceMatches.map((match) => {
          return `Face is ${match.Similarity.toFixed(2)}% similar`;
        });
        setResult(matches.join(", "));
        setSimilarity(response.FaceMatches[0].Similarity);
      } else {
        setResult("No faces matched.");
        setSimilarity(0);
      }
      showSnackbar("Face comparison completed", "success");
    } catch (error) {
      console.error("Error comparing faces:", error);
      setError(`Error comparing faces: ${error.message}`);
      showSnackbar(`Error comparing faces: ${error.message}`, "error");
    } finally {
      setComparing(false);
    }
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
          Upload and Compare Faces
        </Typography>

        <Box display="flex" justifyContent="space-around" marginBottom="30px">
          <Box>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="source-image-upload"
              type="file"
              onChange={(e) => handleFileChange(e, true)}
            />
            <label htmlFor="source-image-upload">
              <Button variant="contained" component="span">
                Select Source Image
              </Button>
            </label>
            {sourceImageUrl && (
              <Card style={{ marginTop: "10px", maxWidth: "200px" }}>
                <CardMedia
                  component="img"
                  image={sourceImageUrl}
                  alt="Source Image"
                />
              </Card>
            )}
          </Box>
          <Box>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="target-image-upload"
              type="file"
              onChange={(e) => handleFileChange(e, false)}
            />
            <label htmlFor="target-image-upload">
              <Button variant="contained" component="span">
                Select Target Image
              </Button>
            </label>
            {targetImageUrl && (
              <Card style={{ marginTop: "10px", maxWidth: "200px" }}>
                <CardMedia
                  component="img"
                  image={targetImageUrl}
                  alt="Target Image"
                />
              </Card>
            )}
          </Box>
        </Box>

        <Box display="flex" justifyContent="center" marginBottom="30px">
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!sourceFile || !targetFile || uploading}
            style={{ textTransform: "none" }}
            startIcon={
              uploading ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {uploading ? "Uploading..." : "Upload Images"}
          </Button>
        </Box>

        <Box display="flex" justifyContent="center" marginBottom="30px">
          <Button
            variant="contained"
            color="primary"
            onClick={handleCompare}
            disabled={!sourceKey || !targetKey || comparing}
            style={{ textTransform: "none" }}
            startIcon={
              comparing ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {comparing ? "Comparing..." : "Compare Faces"}
          </Button>
        </Box>

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
            Highest similarity: {similarity.toFixed(2)}%
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

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={uploading || comparing}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
};

export default CompareFaces;
