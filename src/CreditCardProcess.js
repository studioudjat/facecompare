import React, { useState } from "react";
import {
  Container,
  Typography,
  Button,
  CircularProgress,
  Box,
  Card,
  CardMedia,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Snackbar,
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
    securityCode: response.securityCode || "N/A", // 追加
  };
};

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
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // フォームのステート
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");

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

      canvasRef.current.toBlob(
        (blob) => {
          const imageFile = new File([blob], "captured_image.jpg", {
            type: "image/jpeg",
          });
          setFile(imageFile);
          stopCamera();
        },
        "image/jpeg",
        0.95 // 画像品質を95%に設定（必要に応じて調整）
      );
    }
  };

  const processCard = async () => {
    if (!file) {
      showSnackbar("Please capture an image.", "error");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const extractedInfo = await processCardImage(file);
      showSnackbar("Credit card processing completed successfully.", "success");

      // ここでautofillCardDataを呼び出す
      autofillCardData(extractedInfo);
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

  // Autofill function
  const autofillCardData = (data) => {
    if (data) {
      setName(data.cardHolderName);
      setCardNumber(data.cardNumber);
      // expiryDateが "MM/YY" または "MM/YYYY" の形式であると仮定
      const [month, year] = data.expiryDate.includes("/")
        ? data.expiryDate.split("/")
        : ["", ""];
      setExpMonth(month);
      // 年が2桁または4桁かをチェック
      const fullYear =
        year.length === 2 ? `20${year}` : year.length === 4 ? year : "";
      setExpYear(fullYear);

      setSecurityCode(data.securityCode); // セキュリティコードを設定
    }
  };

  // 月と年の選択肢を作成
  const months = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const years = Array.from({ length: 10 }, (_, i) =>
    (new Date().getFullYear() + i).toString()
  );

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

        {/* Capture Card with Camera ボタン */}
        {!cameraActive && !file && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            marginBottom="30px"
          >
            <Button variant="contained" onClick={startCamera}>
              Capture Card with Camera
            </Button>
          </Box>
        )}

        {/* カメラプレビュー */}
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

        {/* 撮影した画像のプレビュー */}
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

        {/* Autofill Card Data ボタン */}
        {file && (
          <Box display="flex" justifyContent="center" marginTop="20px">
            <Button
              variant="contained"
              color="primary"
              onClick={processCard}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} color="inherit" /> : null
              }
            >
              {loading ? "Processing..." : "Autofill Card Data"}
            </Button>
          </Box>
        )}

        {/* クレジットカード情報入力フォーム */}
        <Box marginTop="30px">
          <FormControl fullWidth margin="normal">
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>

          <FormControl fullWidth margin="normal">
            <TextField
              label="Card Number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </FormControl>

          <Box display="flex" justifyContent="space-between">
            <FormControl style={{ width: "48%" }} margin="normal">
              <InputLabel id="exp-month-label">Exp Month</InputLabel>
              <Select
                labelId="exp-month-label"
                value={expMonth}
                label="Exp Month"
                onChange={(e) => setExpMonth(e.target.value)}
              >
                {months.map((month) => (
                  <MenuItem key={month} value={month}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl style={{ width: "48%" }} margin="normal">
              <InputLabel id="exp-year-label">Exp Year</InputLabel>
              <Select
                labelId="exp-year-label"
                value={expYear}
                label="Exp Year"
                onChange={(e) => setExpYear(e.target.value)}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FormControl fullWidth margin="normal">
            <TextField
              label="Security Code"
              value={securityCode}
              onChange={(e) => setSecurityCode(e.target.value)}
            />
          </FormControl>
        </Box>

        {/* エラーメッセージ表示 */}
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
