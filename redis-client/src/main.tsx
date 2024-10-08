import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import store from "./redux/store.ts";
import "./index.css";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <Toaster />
      <Analytics />
    </Provider>
  </StrictMode>
);
