import React from "react";
import ReactDOM from "react-dom/client"; // React 18 用のモジュールをインポート
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; // React Router のモジュールをインポート
import App from "./App";
import AddImage from "./AddImage";
import MatchFaces from "./MatchFaces";
import ListImages from "./ListImages";
import CompareFaces from "./CompareFaces";
import ExtractIdInfo from "./ExtractIdInfo";

import "./styles.css"; // 外部CSSファイルのインポート

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
      {/* "/compare" パスに対するコンポーネント */}
    </Routes>
  </Router>
);
