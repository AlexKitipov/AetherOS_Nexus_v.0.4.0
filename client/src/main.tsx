import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getUIRootElement } from "@/core/uiRoot";

createRoot(getUIRootElement("desktop")).render(<App />);
