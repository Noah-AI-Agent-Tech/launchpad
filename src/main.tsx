import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "./index.css";
import { ToastProvider } from "@/components/ui/toast";
import { WalletProvider } from "@/lib/wallet";
import { router } from "./router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </WalletProvider>
  </StrictMode>,
);
