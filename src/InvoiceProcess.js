import React, { useState } from "react";
import AWS from "aws-sdk";
import {
  Container,
  Typography,
  Button,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Backdrop,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Menu from "./Menu";

const InvoiceProcess = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // AWS SDKの設定
  AWS.config.update({
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    region: process.env.REACT_APP_AWS_REGION,
  });

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

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

  const processInvoice = async () => {
    if (!file) {
      showSnackbar("Please select a file to process", "error");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Upload file to S3
      const s3 = new AWS.S3();
      const uploadParams = {
        Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
        Key: `docs/${file.name}`,
        Body: file,
      };

      await s3.upload(uploadParams).promise();

      // Analyze document with Textract
      const textract = new AWS.Textract();
      const analyzeParams = {
        Document: {
          S3Object: {
            Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
            Name: `docs/${file.name}`,
          },
        },
        FeatureTypes: ["FORMS", "TABLES"],
      };

      const analyzeResult = await textract
        .analyzeDocument(analyzeParams)
        .promise();

      // Debug: Log the entire Textract result
      console.log(JSON.stringify(analyzeResult, null, 2));

      // Parse results
      const extractedInfo = {
        vendorName: "",
        invoiceDate: "",
        dueDate: "",
        amountDue: "",
        items: [],
      };

      let invoiceDateFound = false;

      // Helper function to get the text of a block
      const getBlockText = (block) => {
        if (block.Text) return block.Text;
        if (block.Relationships && block.Relationships[0].Type === "CHILD") {
          return block.Relationships[0].Ids.map(
            (id) => analyzeResult.Blocks.find((b) => b.Id === id).Text
          ).join(" ");
        }
        return "";
      };

      // Function to extract amount due
      const extractAmountDue = (blocks) => {
        for (let i = 0; i < blocks.length; i++) {
          const text = getBlockText(blocks[i]).toLowerCase();
          if (text.includes("amount due")) {
            // Search for the amount in the next few blocks
            for (let j = i + 1; j < Math.min(i + 5, blocks.length); j++) {
              const amountMatch = getBlockText(blocks[j]).match(
                /\$[\d,]+\.\d{2}/
              );
              if (amountMatch) {
                return amountMatch[0];
              }
            }
          }
        }
        return "";
      };

      extractedInfo.amountDue = extractAmountDue(analyzeResult.Blocks);

      analyzeResult.Blocks.forEach((block) => {
        const text = getBlockText(block).toLowerCase();

        if (block.BlockType === "LINE" || block.BlockType === "WORD") {
          // Extract vendor name
          if (text.includes("cogent communications")) {
            extractedInfo.vendorName = "Cogent Communications, LLC";
          }

          // Extract invoice date
          if (!invoiceDateFound && text.includes("invoice date")) {
            const dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
            if (dateMatch) {
              extractedInfo.invoiceDate = dateMatch[0];
              invoiceDateFound = true;
            }
          }

          // Fallback for invoice date
          if (!invoiceDateFound && text.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
            extractedInfo.invoiceDate = text.match(
              /\d{1,2}\/\d{1,2}\/\d{4}/
            )[0];
            invoiceDateFound = true;
          }

          // Extract due date
          if (text.includes("due upon receipt")) {
            extractedInfo.dueDate = "Due Upon Receipt";
          } else if (text.includes("due date")) {
            const dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
            if (dateMatch) {
              extractedInfo.dueDate = dateMatch[0];
            }
          }
        } else if (block.BlockType === "TABLE") {
          // Extract items from table
          if (block.Relationships && block.Relationships.length > 0) {
            const tableRows = block.Relationships.find(
              (r) => r.Type === "CHILD"
            ).Ids;
            tableRows.forEach((rowId, index) => {
              const row = analyzeResult.Blocks.find((b) => b.Id === rowId);
              if (row && row.BlockType === "CELL") {
                if (index !== 0) {
                  // Skip the header row
                  const cellContents =
                    row.Relationships && row.Relationships.length > 0
                      ? row.Relationships.find(
                          (r) => r.Type === "CHILD"
                        ).Ids.map((id) => {
                          const cell = analyzeResult.Blocks.find(
                            (b) => b.Id === id
                          );
                          return cell ? cell.Text : "";
                        })
                      : [];
                  if (cellContents.length >= 4) {
                    extractedInfo.items.push({
                      description: cellContents[0],
                      fromDate: cellContents[1],
                      toDate: cellContents[2],
                      amount: cellContents[3],
                    });
                  }
                }
              }
            });
          }
        }
      });

      setResult(extractedInfo);
      showSnackbar("Invoice processing completed successfully", "success");
    } catch (err) {
      console.error("Error processing invoice:", err);
      setError(
        "An error occurred while processing the invoice: " + err.message
      );
      showSnackbar("An error occurred while processing the invoice", "error");
    } finally {
      setLoading(false);
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
          Invoice Processing
        </Typography>

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          marginBottom="30px"
        >
          <input
            accept="application/pdf"
            style={{ display: "none" }}
            id="raised-button-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="raised-button-file">
            <Button variant="contained" component="span">
              Select Invoice PDF
            </Button>
          </label>
          {file && (
            <Typography style={{ marginTop: "10px" }}>
              Selected file: {file.name}
            </Typography>
          )}
        </Box>

        <Box display="flex" justifyContent="center" marginBottom="30px">
          <Button
            variant="contained"
            color="primary"
            onClick={processInvoice}
            disabled={loading || !file}
            style={{ textTransform: "none" }}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {loading ? "Processing..." : "Process Invoice"}
          </Button>
        </Box>

        {result && (
          <Card style={{ marginTop: "30px" }}>
            <CardContent>
              <Typography variant="h6">Extracted Information:</Typography>
              <Typography>Vendor Name: {result.vendorName}</Typography>
              <Typography>Invoice Date: {result.invoiceDate}</Typography>
              <Typography>Due Date: {result.dueDate}</Typography>
              <Typography>Amount Due: {result.amountDue}</Typography>
              <Typography variant="h6" style={{ marginTop: "20px" }}>
                Purchased Items:
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.price}</TableCell>
                        <TableCell>{item.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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

        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Container>
    </div>
  );
};

export default InvoiceProcess;
