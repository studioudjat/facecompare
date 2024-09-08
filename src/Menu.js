import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
} from "@mui/material";
import { Link } from "react-router-dom";

const Menu = () => {
  return (
    <AppBar
      position="fixed"
      style={{ backgroundColor: "#1976d2", width: "100%", top: 0 }}
    >
      <Container maxWidth="md">
        <Toolbar style={{ justifyContent: "space-between", padding: 0 }}>
          <Box display="flex" alignItems="center">
            {/* ロゴ画像をpublicフォルダから参照 */}
            <img
              // src={`${process.env.PUBLIC_URL}/images/logo.png`}
              src="/images/logo.png"
              alt="FaceCompare Logo"
              style={{ width: "40px", height: "40px", marginRight: "10px" }}
            />
            {/* タイトル */}
            <Typography
              variant="h6"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              FaceCompare
            </Typography>
          </Box>
          <div>
            <Button
              color="inherit"
              component={Link}
              to="/add"
              style={{
                textTransform: "none",
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              Add
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/list"
              style={{
                textTransform: "none",
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              List
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/match"
              style={{
                textTransform: "none",
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              Match
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/compare"
              style={{
                textTransform: "none",
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              Compare
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/extract"
              style={{
                textTransform: "none",
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              Extract
            </Button>
          </div>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Menu;
