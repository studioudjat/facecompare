import React, { useState } from "react";
import AWS from "aws-sdk";
import {
  Button,
  TextField,
  CircularProgress,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Box,
  Snackbar,
  Backdrop,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Menu from "./Menu";

const AddImage = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = () => {
    if (!file) {
      showSnackbar("Please select a file to upload.", "error");
      return;
    }

    setLoading(true);

    // AWS S3にアクセスするための認証情報を設定
    AWS.config.update({
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
      region: process.env.REACT_APP_AWS_REGION,
    });

    const s3 = new AWS.S3();
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
      Key: `images/${file.name}`,
      Body: file,
      ContentType: file.type,
    };

    s3.upload(params, (err, data) => {
      setLoading(false);
      if (err) {
        showSnackbar(`Upload failed: ${err.message}`, "error");
      } else {
        showSnackbar("Upload successful!", "success");
        // アップロード成功後、ファイル選択とプレビューをリセット
        setFile(null);
        setPreview(null);
      }
    });
  };

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
          Upload Image
        </Typography>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          <Card style={{ width: "100%", maxWidth: "500px" }}>
            <CardContent>
              <TextField
                type="file"
                onChange={handleFileChange}
                variant="outlined"
                fullWidth
                margin="normal"
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
              {preview && (
                <Box display="flex" justifyContent="center" marginBottom="20px">
                  <Card style={{ maxWidth: "300px" }}>
                    <CardMedia
                      component="img"
                      image={preview}
                      alt="Preview"
                      style={{ maxHeight: "200px", objectFit: "contain" }}
                    />
                  </Card>
                </Box>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={loading || !file}
                fullWidth
                style={{ textTransform: "none" }}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
                }
              >
                {loading ? "Uploading..." : "Upload"}
              </Button>
            </CardContent>
          </Card>
        </Box>
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
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
};

export default AddImage;
