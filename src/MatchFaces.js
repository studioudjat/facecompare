import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardMedia,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import AWS from "aws-sdk";
import Menu from "./Menu";
import { listImagesFromS3, renameProfileImage } from "./s3Service";
import ImageGallery from "./ImageGallery";

const ResultDialog = ({ open, onClose, result, similarity }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Face Comparison Result</DialogTitle>
      <DialogContent>
        <Typography variant="body1">{result}</Typography>
        {similarity !== null && similarity !== undefined && (
          <Typography
            variant="body1"
            style={{ marginTop: "10px", color: "orange" }}
          >
            Highest similarity: {similarity.toFixed(2)}%
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ResultDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  result: PropTypes.string,
  similarity: PropTypes.number,
};

const MatchFaces = () => {
  const [images, setImages] = useState([]);
  const [targetKey, setTargetKey] = useState("");
  const [sourceImageUrl, setSourceImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [dialogResult, setDialogResult] = useState(null);

  useEffect(() => {
    fetchImages();
    fetchProfileImage();
  }, []);

  const fetchProfileImage = async () => {
    try {
      const s3 = new AWS.S3();
      const profileUrl = s3.getSignedUrl("getObject", {
        Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
        Key: "images/profile.jpg",
        Expires: 300,
      });
      setSourceImageUrl(profileUrl);
    } catch (err) {
      console.error("Failed to fetch profile image:", err);
    }
  };

  const fetchImages = async () => {
    try {
      const imageList = await listImagesFromS3();
      const filteredImages = imageList.filter(
        (image) => image.key !== "images/profile.jpg"
      );
      setImages(filteredImages);
    } catch (err) {
      console.error("Failed to fetch images:", err);
    }
  };

  const handleImageClick = (key) => {
    setTargetKey(key);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleCompare = async () => {
    if (!targetKey) {
      setError("ターゲット画像が選択されていません");
      return;
    }

    setLoading(true);
    const rekognition = new AWS.Rekognition();

    const params = {
      SourceImage: {
        S3Object: {
          Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
          Name: "images/profile.jpg",
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
        const result = matches.join(", ");
        const similarity = response.FaceMatches[0].Similarity;
        setDialogResult({ result, similarity });
        setOpenResultDialog(true);
      } else {
        setDialogResult({ result: "No faces matched.", similarity: null });
        setOpenResultDialog(true);
      }
    } catch (error) {
      console.error("Error comparing faces:", error);
      setError("Error comparing faces: " + error.message);
      showSnackbar("Error comparing faces: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const setAsSourceImage = async () => {
    setLoading(true);
    const timestamp = new Date().getTime();

    try {
      await renameProfileImage(targetKey, timestamp);
      const newProfileImageUrl = `https://${process.env.REACT_APP_S3_BUCKET_NAME}.s3.${process.env.REACT_APP_AWS_REGION}.amazonaws.com/images/profile.jpg?t=${timestamp}`;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSourceImageUrl(newProfileImageUrl);
      await fetchImages();
      showSnackbar("Profile image updated successfully", "success");
    } catch (err) {
      console.error("Error setting image as source:", err.message);
      showSnackbar("Error updating profile image: " + err.message, "error");
    } finally {
      setLoading(false);
    }
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
          Compare Faces
        </Typography>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          marginBottom="30px"
        >
          <Card style={{ width: "50%" }}>
            <CardMedia
              component="img"
              height="300"
              image={sourceImageUrl}
              alt="Source Image (Profile)"
            />
          </Card>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            width="45%"
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleCompare}
              disabled={!targetKey || loading}
              style={{ marginBottom: "10px" }}
            >
              {loading ? "Comparing..." : "Match Faces"}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={setAsSourceImage}
              disabled={!targetKey || loading}
            >
              {loading ? "Processing..." : "Set as Source"}
            </Button>
          </Box>
        </Box>

        <Typography variant="h6" align="center" gutterBottom>
          Select Target Image
        </Typography>
        <ImageGallery
          images={images}
          onSelect={handleImageClick}
          selectedKey={targetKey}
        />

        {error && (
          <Typography
            variant="h6"
            align="center"
            style={{ marginTop: "20px", color: "red" }}
          >
            {error}
          </Typography>
        )}

        <ResultDialog
          open={openResultDialog}
          onClose={() => setOpenResultDialog(false)}
          result={dialogResult?.result || ""}
          similarity={dialogResult?.similarity || null}
        />

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

export default MatchFaces;
