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
  Snackbar,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Backdrop,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close";
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

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

  const handlePreviewOpen = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  // 画像をS3にアップロードする処理
  const uploadToS3 = (file) => {
    return new Promise((resolve, reject) => {
      const s3 = new AWS.S3();
      const params = {
        Bucket: process.env.REACT_APP_S3_BUCKET_NAME, // S3バケット名
        Key: `images/${file.name}`, // ファイル名をキーとして使用
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

        {sourceImageUrl && targetImageUrl && (
          <Box display="flex" justifyContent="space-around" marginBottom="30px">
            <Card
              onClick={() => handlePreviewOpen(sourceImageUrl)}
              style={{ cursor: "pointer" }}
            >
              <CardMedia
                component="img"
                height="200"
                image={sourceImageUrl}
                alt="Source Image"
              />
            </Card>
            <Card
              onClick={() => handlePreviewOpen(targetImageUrl)}
              style={{ cursor: "pointer" }}
            >
              <CardMedia
                component="img"
                height="200"
                image={targetImageUrl}
                alt="Target Image"
              />
            </Card>
          </Box>
        )}

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

      <Dialog
        open={previewOpen}
        onClose={handlePreviewClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Image Preview
          <IconButton
            aria-label="close"
            onClick={handlePreviewClose}
            style={{ position: "absolute", right: 8, top: 8, color: "#aaa" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              style={{ width: "100%", height: "auto" }}
            />
          )}
        </DialogContent>
      </Dialog>

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
