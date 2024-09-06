import React from "react";
import { AppBar, Toolbar, Typography, Button, Container } from "@mui/material";
import { Link } from "react-router-dom";

const Menu = () => {
  return (
    <AppBar
      position="fixed"
      style={{ backgroundColor: "#1976d2", width: "100%", top: 0 }}
    >
      <Container maxWidth="md">
        {" "}
        {/* Container を追加して幅を制限 */}
        <Toolbar style={{ justifyContent: "space-between", padding: 0 }}>
          <Typography
            variant="h6"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            FaceCompare
          </Typography>
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
          </div>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Menu;
