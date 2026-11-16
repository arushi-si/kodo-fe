import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { appStore } from "./utils/appStore";
import { setupInterceptors } from "./utils/api";

setupInterceptors(appStore);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
