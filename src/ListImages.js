import React, { useState, useEffect, useCallback } from "react";
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
  Snackbar,
  CircularProgress,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import Menu from "./Menu";

const ListImages = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const fetchImages = useCallback(() => {
    const s3 = new AWS.S3();
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
      Prefix: "images/",
    };

    s3.listObjectsV2(params, (err, data) => {
      if (err) {
        console.error("Error fetching images:", err);
        showSnackbar("Error fetching images", "error");
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
  }, []);

  useEffect(() => {
    AWS.config.update({
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
      region: process.env.REACT_APP_AWS_REGION,
    });

    fetchImages();
  }, [fetchImages]);

  const handleDelete = (key) => {
    setLoading(true);
    const s3 = new AWS.S3();
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
      Key: key,
    };

    s3.deleteObject(params, (err, data) => {
      setLoading(false);
      if (err) {
        console.error("Error deleting image:", err);
        showSnackbar(`Error deleting image: ${err.message}`, "error");
      } else {
        console.log(`Deleted image: ${key}`);
        showSnackbar("Image deleted successfully", "success");
        fetchImages(); // 削除後、画像リストを更新
      }
    });
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
          Uploaded Images
        </Typography>

        <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2}>
          {images.map((image, index) => (
            <Box
              key={index}
              flex="1 1 calc(30% - 10px)"
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
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSelectedImage(image.url);
                    setOpen(true);
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
                    variant="contained"
                    color="primary"
                    onClick={() => handleDelete(image.key)}
                    disabled={loading}
                    startIcon={
                      loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <DeleteIcon />
                      )
                    }
                    style={{
                      textTransform: "none",
                      minWidth: "100px",
                    }}
                  >
                    {loading ? "Deleting..." : "Delete"}
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
    </div>
  );
};

export default ListImages;
