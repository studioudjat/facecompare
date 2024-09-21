import React, { useState } from "react";
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

// AWS SDK v3のクライアントとコマンドをインポート
import {
  TextractClient,
  AnalyzeDocumentCommand,
} from "@aws-sdk/client-textract";

// 各ベンダーごとのモジュールをインポート
import { processCogentInvoice } from "./CogentInvoiceModule";
import { processOpenAIInvoice } from "./OpenAIInvoiceModule";

const InvoiceProcess = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

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
      // ファイルをBase64に変換してTextractに渡す
      const fileData = await file.arrayBuffer();
      const textractClient = new TextractClient({
        region: process.env.REACT_APP_AWS_REGION,
        credentials: {
          accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
        },
      });

      const analyzeParams = {
        Document: {
          Bytes: new Uint8Array(fileData), // ローカルファイルのデータをTextractに渡す
        },
        FeatureTypes: ["FORMS", "TABLES"],
      };

      const analyzeCommand = new AnalyzeDocumentCommand(analyzeParams);
      const analyzeResult = await textractClient.send(analyzeCommand);

      // Textractの解析結果をデバッグするためのログ
      console.log(JSON.stringify(analyzeResult.Blocks, null, 2));

      // 検出したベンダー名の判定
      const vendorName = detectVendor(analyzeResult.Blocks);

      let extractedInfo;
      switch (vendorName) {
        case "Cogent Communications":
          extractedInfo = processCogentInvoice(analyzeResult.Blocks);
          break;
        case "OpenAI, LLC":
          extractedInfo = processOpenAIInvoice(analyzeResult.Blocks);
          break;
        default:
          // エラーメッセージを詳細にするための追加コード
          console.error(
            "Vendor not found in the document. Analyzed text:",
            JSON.stringify(analyzeResult.Blocks, null, 2)
          );
          throw new Error("Unsupported vendor");
      }

      setResult(extractedInfo);
      console.log("Final Extracted Info:", extractedInfo); // extractedInfoの最終確認

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

  // ベンダー名を抽出する関数
  const detectVendor = (blocks) => {
    for (const block of blocks) {
      if (block.BlockType === "LINE") {
        const text = (block.Text || "").toLowerCase();
        console.log("Detected Text:", text); // ベンダー検出のためのログ

        if (text.includes("cogent communications"))
          return "Cogent Communications";
        if (text.includes("openai")) return "OpenAI, LLC";
      }
    }
    return "Unknown Vendor";
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
                      <TableCell>From Date</TableCell>
                      <TableCell>To Date</TableCell>
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.fromDate}</TableCell>
                        <TableCell>{item.toDate}</TableCell>
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
