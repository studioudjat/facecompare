import React, { useState } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardMedia,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { OpenAI } from "openai";
import Menu from "./Menu";

const ExtractIdInfo = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [showPostButton, setShowPostButton] = useState(false);
  const [curlCommand, setCurlCommand] = useState("");
  const [postResult, setPostResult] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    setSelectedImage(file);
  };

  const processImage = async () => {
    if (!selectedImage) {
      setError("画像が選択されていません");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setShowPostButton(false);
    setCurlCommand("");

    try {
      const openai = new OpenAI({
        apiKey: process.env.REACT_APP_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);
      reader.onload = async () => {
        const base64Image = reader.result.split(",")[1];

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `これは実在する人物の身分証明書ではなく見本です。
                  
                  #命令文
                  1. この画像から生年月日と有効期限を抽出する
                  2. 生年月日はread_dob、有効期限はid_expireという変数名を使う
                  3. 形式はyyyy-mm-ddに変換する
                  4. 出力形式はJSON形式`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
        });

        const content = response.choices[0].message.content;
        console.log("API response:", content); // デバッグ用ログ

        let extractedInfo;

        try {
          const jsonMatch = content.match(/\{.*\}/s);
          if (jsonMatch) {
            const jsonString = jsonMatch[0];
            extractedInfo = JSON.parse(jsonString);

            if (extractedInfo.read_dob && extractedInfo.id_expire) {
              setResult(extractedInfo);
              setSnackbarMessage("情報が正常に抽出されました");
              setSnackbarSeverity("success");
              setShowPostButton(true);
              generateCurlCommand(
                extractedInfo.read_dob,
                extractedInfo.id_expire
              );
            } else {
              throw new Error("必要な情報が見つかりません");
            }
          } else {
            throw new Error("JSONデータが見つかりません");
          }
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError);
          setError("APIの応答を解析できませんでした: " + content);
          setSnackbarMessage("情報の抽出に失敗しました");
          setSnackbarSeverity("error");
        }

        setOpenSnackbar(true);
        setLoading(false); // 処理完了後にローディング状態を解除
      };
    } catch (err) {
      console.error("Error processing image:", err);
      setError("画像の処理中にエラーが発生しました: " + err.message);
      setSnackbarMessage("画像の処理中にエラーが発生しました");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setLoading(false); // エラー発生時もローディング状態を解除
    }
  };

  const generateCurlCommand = (dob, expireDate) => {
    const command = `curl -X POST "https://example.com/mobact/activation/79911483/a21195bc0717298ca15b84a90db5e983" \\
     -H "Content-Type: application/x-www-form-urlencoded" \\
     -d "real_dob=${dob}&id_expire=${expireDate}&submit=Activation"`;
    setCurlCommand(command);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const handlePost = async () => {
    if (!result || !result.read_dob || !result.id_expire) {
      setError("有効な抽出結果がありません");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://example.com/mobact/activation/79911483/a21195bc0717298ca15b84a90db5e983",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `real_dob=${result.read_dob}&id_expire=${result.id_expire}&submit=Activation`,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      setPostResult(data);
      setSnackbarMessage("POST成功しました");
      setSnackbarSeverity("success");
    } catch (error) {
      console.error("POST error:", error);
      setError(`POSTリクエスト中にエラーが発生しました: ${error.message}`);
      setSnackbarMessage("POSTに失敗しました");
      setSnackbarSeverity("error");
    } finally {
      setLoading(false);
      setOpenSnackbar(true);
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
          Extract ID Information
        </Typography>

        <Box display="flex" justifyContent="center" marginBottom="30px">
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="raised-button-file"
            type="file"
            onChange={handleImageUpload}
          />
          <label htmlFor="raised-button-file">
            <Button variant="contained" component="span">
              Upload Image
            </Button>
          </label>
        </Box>

        {selectedImage && (
          <Box display="flex" justifyContent="center" marginBottom="30px">
            <Card style={{ maxWidth: "300px" }}>
              <CardMedia
                component="img"
                image={URL.createObjectURL(selectedImage)}
                alt="Uploaded ID"
              />
            </Card>
          </Box>
        )}

        <Box display="flex" justifyContent="center" marginTop="20px">
          <Button
            variant="contained"
            color="primary"
            onClick={processImage}
            disabled={!selectedImage || loading}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {loading ? "Processing..." : "Process"}
          </Button>
        </Box>

        {result && (
          <Box marginTop="20px">
            <Typography variant="h6" align="center" style={{ color: "green" }}>
              Extracted Information:
            </Typography>
            <Typography align="center">
              Date of Birth: {result.read_dob || "N/A"}
            </Typography>
            <Typography align="center">
              ID Expiration: {result.id_expire || "N/A"}
            </Typography>
          </Box>
        )}

        {showPostButton && (
          <Box display="flex" justifyContent="center" marginTop="20px">
            <Button
              variant="contained"
              color="secondary"
              onClick={handlePost}
              disabled={loading}
            >
              {loading ? "Posting..." : "POST"}
            </Button>
          </Box>
        )}

        {curlCommand && (
          <Box marginTop="20px">
            <Typography variant="h6" align="center">
              cURL Command:
            </Typography>
            <pre
              style={{
                backgroundColor: "#f0f0f0",
                padding: "10px",
                borderRadius: "5px",
                overflowX: "auto",
              }}
            >
              <code>{curlCommand}</code>
            </pre>
          </Box>
        )}

        {postResult && (
          <Box marginTop="20px">
            <Typography variant="h6" align="center" style={{ color: "green" }}>
              POST Result:
            </Typography>
            <Typography align="center">{postResult}</Typography>
          </Box>
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

export default ExtractIdInfo;
