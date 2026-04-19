import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getUIRootElement } from "@/core/uiRoot";
import { initializeShellArchitecture } from "@/core/shellBootstrap";

initializeShellArchitecture();

createRoot(getUIRootElement("desktop")).render(<App />);
