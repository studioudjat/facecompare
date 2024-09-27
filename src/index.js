import React from "react";
import ReactDOM from "react-dom/client"; // React 18 用のモジュールをインポート
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; // React Router のモジュールをインポート
import App from "./App";
import AddImage from "./AddImage";
import MatchFaces from "./MatchFaces";
import ListImages from "./ListImages";
import CompareFaces from "./CompareFaces";
import ExtractIdInfo from "./ExtractIdInfo";
import LicenseProcess from "./LicenseProcess";
import "./styles.css"; // 外部CSSファイルのインポート
import InvoiceProcess from "./InvoiceProcess";
import CreditCardProcess from "./CreditCardProcess";

const root = ReactDOM.createRoot(document.getElementById("root")); // React 18 の新しい root API を使用

root.render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />{" "}
      {/* ルートパスに対するコンポーネント */}
      <Route path="/add" element={<AddImage />} />{" "}
      {/* "/add" パスに対するコンポーネント */}
      <Route path="/list" element={<ListImages />} />{" "}
      {/* "/list" パスに対するコンポーネント */}
      <Route path="/match" element={<MatchFaces />} />{" "}
      {/* "/match" パスに対するコンポーネント */}
      <Route path="/compare" element={<CompareFaces />} />{" "}
      {/* "/compare" パスに対するコンポーネント */}
      <Route path="/extract" element={<ExtractIdInfo />} />{" "}
      {/* "/extract" パスに対するコンポーネント */}
      <Route path="/process" element={<InvoiceProcess />} />{" "}
      {/* "/process" パスに対するコンポーネント */}
      <Route path="/id" element={<LicenseProcess />} />{" "}
      {/* "/id" パスに対するコンポーネント */}
      <Route path="/card" element={<CreditCardProcess />} />{" "}
      {/* "/id" パスに対するコンポーネント */}
    </Routes>
  </Router>
);
