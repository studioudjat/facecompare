import React, { useState, useEffect } from "react";
import AWS from "aws-sdk";
import {
  Container,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Card,
  CardMedia,
  CardActions,
  Button,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Menu from "./Menu";

const ListImages = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    AWS.config.update({
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
      region: process.env.REACT_APP_AWS_REGION,
    });

    fetchImages();
  }, []);

  // 画像をS3から取得する関数
  const fetchImages = () => {
    const s3 = new AWS.S3();
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
    };

    s3.listObjectsV2(params, (err, data) => {
      if (err) {
        console.error("Error fetching images:", err);
      } else {
        const imagePromises = data.Contents.map((item) => {
          const signedUrl = s3.getSignedUrl("getObject", {
            Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
            Key: item.Key,
            Expires: 300,
          });
          return { key: item.Key, url: signedUrl };
        });
        Promise.all(imagePromises).then((results) => setImages(results));
      }
    });
  };

  // 画像をS3から削除する関数
  const handleDelete = (key) => {
    const s3 = new AWS.S3();
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
      Key: key,
    };

    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.error("Error deleting image:", err);
      } else {
        console.log(`Deleted image: ${key}`);
        fetchImages(); // 削除後、画像リストを更新
      }
    });
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
          Uploaded Images
        </Typography>

        {/* Flexboxを使用してカードのレイアウトを調整 */}
        <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2}>
          {images.map((image, index) => (
            <Box
              key={index}
              flex="1 1 calc(30% - 10px)" // カードを3列に配置し、幅を調整
              maxWidth="calc(30% - 10px)"
              boxSizing="border-box"
            >
              <Card style={{ position: "relative", overflow: "hidden" }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={image.url}
                  alt={image.key}
                  style={{
                    transition: "transform 0.5s ease",
                    objectFit: "cover",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = "scale(1.1)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                />
                <CardActions style={{ justifyContent: "center" }}>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => {
                      setSelectedImage(image.url);
                      setOpen(true);
                    }}
                    style={{ textTransform: "none" }}
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    color="secondary"
                    onClick={() => handleDelete(image.key)}
                    style={{ textTransform: "none" }}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Image Preview
            <IconButton
              aria-label="close"
              onClick={() => setOpen(false)}
              style={{ position: "absolute", right: 8, top: 8, color: "#aaa" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Selected"
                style={{ width: "100%", height: "auto" }}
              />
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </div>
  );
};

export default ListImages;
