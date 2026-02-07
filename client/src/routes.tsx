import { createBrowserRouter, Navigate } from "react-router-dom";
import { Login } from "@/pages/Login";
import { Lookup } from "@/pages/Lookup";
import { PaymentMock } from "@/pages/PaymentMock";
import { Statistics } from "@/pages/Statistics";
import { PaymentHistory } from "@/pages/PaymentHistory";
import { Protected } from "@/components/Protected";
import { Shell } from "@/components/Shell";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <Login /> },
  {
    path: "/lookup",
    element: (
      <Protected>
        <Shell>
          <Lookup />
        </Shell>
      </Protected>
    ),
  },
  {
    path: "/payment",
    element: (
      <Protected>
        <Shell>
          <PaymentMock />
        </Shell>
      </Protected>
    ),
  },
  {
    path: "/statistics",
    element: (
      <Protected>
        <Shell>
          <Statistics />
        </Shell>
      </Protected>
    ),
  },
  {
    path: "/history",
    element: (
      <Protected>
        <Shell>
          <PaymentHistory />
        </Shell>
      </Protected>
    ),
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
