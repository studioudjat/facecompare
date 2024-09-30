import React, { useState } from "react";
import {
  Container,
  Typography,
  Button,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Snackbar,
  CardMedia,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Menu from "./Menu"; // メニューコンポーネントのインポート

// バックエンドのエンドポイント URL
const API_ENDPOINT = "http://localhost:8080/process-id-card";

// API から抽出された運転免許証情報をフロントエンドで処理する関数
const extractLicenseInfo = (response) => {
  return {
    name: response.name || "N/A",
    dateOfBirth: response.dateOfBirth || "N/A",
    expiryDate: response.expiryDate || "N/A",
  };
};

// 画像をアップロードしてバックエンドで処理し、結果を取得する関数
const processLicenseImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to process image.");
    }

    const result = await response.json();
    console.log("Backend API Result:", result);

    return extractLicenseInfo(result);
  } catch (err) {
    console.error("Error processing license:", err);
    throw err;
  }
};

const LicenseProcess = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
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

  const processLicense = async () => {
    if (!file) {
      showSnackbar("Please select a file to process", "error");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const extractedInfo = await processLicenseImage(file);
      setResult(extractedInfo);
      showSnackbar("License processing completed successfully", "success");
    } catch (err) {
      setError(
        "An error occurred while processing the license: " + err.message
      );
      showSnackbar("An error occurred while processing the license", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Menu /> {/* メニューを追加 */}
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
          License Processing
        </Typography>

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          marginBottom="30px"
        >
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="raised-button-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="raised-button-file">
            <Button variant="contained" component="span">
              Select License Image
            </Button>
          </label>
          {file && (
            <Typography style={{ marginTop: "10px" }}>
              Selected file: {file.name}
            </Typography>
          )}
        </Box>

        {file && (
          <Box display="flex" justifyContent="center" marginBottom="30px">
            <Card style={{ maxWidth: "300px" }}>
              <CardMedia
                component="img"
                image={URL.createObjectURL(file)}
                alt="Uploaded License"
              />
            </Card>
          </Box>
        )}

        <Box display="flex" justifyContent="center" marginBottom="30px">
          <Button
            variant="contained"
            color="primary"
            onClick={processLicense}
            disabled={loading || !file}
            style={{ textTransform: "none" }}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {loading ? "Processing..." : "Process License"}
          </Button>
        </Box>

        {result && (
          <Card style={{ marginTop: "30px" }}>
            <CardContent>
              <Typography
                variant="h6"
                align="center"
                style={{ color: "green" }}
              >
                Extracted Information:
              </Typography>
              <Typography align="center">Name: {result.name}</Typography>
              <Typography align="center">
                Date of Birth: {result.dateOfBirth}
              </Typography>
              <Typography align="center">
                Expiration Date: {result.expiryDate}
              </Typography>
            </CardContent>
          </Card>
        )}

        {error && (
          <Typography
            variant="body1"
            color="error"
            align="center"
            style={{ marginTop: "20px" }}
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

export default LicenseProcess;
