import React from "react";
import { Box, Card, CardMedia } from "@mui/material";

const ImageGallery = ({ images, onSelect, selectedKey }) => {
  console.log("ImageGallery component loaded."); // コンポーネントがロードされたことを確認

  // 画像のキーを確認するデバッグ処理
  console.log("Images received in ImageGallery:", images);

  // images の中の key をすべて確認
  images.forEach((image) => {
    console.log("Image key:", image.key);
  });

  // profile.jpg を除外する処理
  const filteredImages = images.filter(
    (image) => image.key !== "images/profile.jpg"
  );

  console.log("Filtered images (excluding profile.jpg):", filteredImages);

  return (
    <Box display="flex" flexWrap="wrap" gap={2}>
      {filteredImages.map((image) => (
        <Card
          key={image.key}
          onClick={() => onSelect(image.key)}
          style={{
            border:
              selectedKey === image.key
                ? "3px solid #1976d2"
                : "3px solid transparent",
            cursor: "pointer",
            width: "120px",
            height: "120px",
          }}
        >
          <CardMedia
            component="img"
            image={image.url}
            alt="Target Image"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Card>
      ))}
    </Box>
  );
};

export default ImageGallery;
