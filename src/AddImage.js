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
  Box, // Boxをインポート
} from "@mui/material";
import Menu from "./Menu"; // メニューをインポート

const AddImage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setMessage("");

    // AWS S3にアクセスするための認証情報を設定
    AWS.config.update({
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
      region: process.env.REACT_APP_AWS_REGION,
    });

    const s3 = new AWS.S3();
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME, // S3バケットの名前を.envファイルから取得
      Key: file.name,
      Body: file,
      ContentType: file.type,
    };

    s3.upload(params, (err, data) => {
      setUploading(false);
      if (err) {
        setMessage(`Upload failed: ${err.message}`);
      } else {
        setMessage(`Upload successful! File URL: ${data.Location}`);
      }
    });
  };

  return (
    <div>
      <Menu /> {/* メニューを表示 */}
      <Container maxWidth="md" style={{ marginTop: "100px" }}>
        {" "}
        {/* メニューバーに対する余白を追加 */}
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
        {/* Boxを使用してレイアウトを調整 */}
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
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={uploading}
                fullWidth
                style={{ textTransform: "none" }}
              >
                {uploading ? <CircularProgress size={24} /> : "Upload"}
              </Button>
              {message && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  align="center"
                  style={{ marginTop: "10px" }}
                >
                  {message}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </div>
  );
};

export default AddImage;
