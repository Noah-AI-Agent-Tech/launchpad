import { createBrowserRouter } from "react-router";
import { RootLayout } from "@/components/layout/root-layout";
import { HomePage } from "@/pages/home";
import { LaunchPage } from "@/pages/launch";
import { TokenPage } from "@/pages/token";
import { NotFoundPage, RouteErrorPage } from "@/pages/not-found";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/token/:mint", element: <TokenPage /> },
      { path: "/launch", element: <LaunchPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
