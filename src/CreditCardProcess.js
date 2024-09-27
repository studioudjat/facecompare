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
import Menu from "./Menu"; // Importing the Menu component

// Backend endpoint URL
const API_ENDPOINT = "http://localhost:3000/process-credit-card";

// Function to process the credit card information extracted from the API
const extractCardInfo = (response) => {
  return {
    cardNumber: response.cardNumber || "N/A",
    expiryDate: response.expiryDate || "N/A",
    cardHolderName: response.cardHolderName || "N/A",
  };
};

// Function to upload the image, process it in the backend, and retrieve the result
const processCardImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to process the image.");
    }

    const result = await response.json();
    console.log("Result from backend:", result);

    return extractCardInfo(result);
  } catch (err) {
    console.error("Error processing credit card:", err);
    throw err;
  }
};

const CreditCardProcess = () => {
  const [file, setFile] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

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

  // Function to start the camera
  const startCamera = () => {
    setCameraActive(true);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Failed to start the camera:", err);
        showSnackbar(
          "Failed to start the camera. Please check your permissions.",
          "error"
        );
      });
  };

  // Function to stop the camera
  const stopCamera = () => {
    setCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
  };

  // Function to capture the image
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(
        videoRef.current,
        0,
        0,
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );

      canvasRef.current.toBlob((blob) => {
        const imageFile = new File([blob], "captured_image.jpg", {
          type: "image/jpeg",
        });
        setFile(imageFile);
        stopCamera();
      }, "image/jpeg");
    }
  };

  const processCard = async () => {
    if (!file) {
      showSnackbar("Please capture an image.", "error");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const extractedInfo = await processCardImage(file);
      setResult(extractedInfo);
      showSnackbar("Credit card processing completed successfully.", "success");
    } catch (err) {
      setError(
        "An error occurred while processing the credit card: " + err.message
      );
      showSnackbar(
        "An error occurred while processing the credit card.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Menu /> {/* Adding the Menu component */}
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
          Credit Card Processing
        </Typography>

        {!cameraActive && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            marginBottom="30px"
          >
            <Button variant="contained" onClick={startCamera}>
              Start Camera
            </Button>
          </Box>
        )}

        {cameraActive && (
          <Box display="flex" flexDirection="column" alignItems="center">
            <video
              ref={videoRef}
              autoPlay
              style={{ width: "100%", maxWidth: "400px" }}
            ></video>
            <Button
              variant="contained"
              color="primary"
              onClick={captureImage}
              style={{ marginTop: "20px" }}
            >
              Capture Image
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={stopCamera}
              style={{ marginTop: "10px" }}
            >
              Stop Camera
            </Button>
          </Box>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {file && (
          <Box display="flex" justifyContent="center" marginTop="30px">
            <Card style={{ maxWidth: "300px" }}>
              <CardMedia
                component="img"
                image={URL.createObjectURL(file)}
                alt="Captured Credit Card"
              />
            </Card>
          </Box>
        )}

        <Box display="flex" justifyContent="center" marginTop="30px">
          <Button
            variant="contained"
            color="primary"
            onClick={processCard}
            disabled={loading || !file}
            style={{ textTransform: "none" }}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {loading ? "Processing..." : "Process Credit Card"}
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
              <Typography align="center">
                Card Number: {result.cardNumber}
              </Typography>
              <Typography align="center">
                Expiry Date: {result.expiryDate}
              </Typography>
              <Typography align="center">
                Cardholder Name: {result.cardHolderName}
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

export default CreditCardProcess;
