
import { createBrowserRouter } from "react-router-dom";
import Shop from "./pages/Shop";
import EngagementTasksPage from "./pages/EngagementTasksPage.tsx";
import AdminDashboard from "./pages/AdminDashboard";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Shop />,
    },
    {
      path: "/engagement-tasks",
      element: <EngagementTasksPage />,
    },
    {
      path: "/admin",
      element: <AdminDashboard />,
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);

export default router;
