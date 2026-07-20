import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./Guards";
import { RouteWrapper } from "./RouteWrapper";
import {
  LandingPage,
  SignInPage,
  SignUpPage,
  DashboardPage,
  DocumentsPage,
  DocumentLayout,
  ChatPage,
  NotesPage,
  SummaryPage,
  QuizPage,
  FlashcardsPage,
  HistoryPage,
  ProfilePage,
  SettingsPage,
  NotFoundPage,
  DashboardLayout,
  AboutPage,
  FeaturesPage,
  PricingPage,
  ContactPage,
  ForgotPasswordPage,
  UploadPage,
} from "./pages";

export const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────────────────────────
  {
    path: "/",
    element: <RouteWrapper><LandingPage /></RouteWrapper>,
  },
  {
    element: <PublicRoute />,
    children: [
      { path: "/sign-in", element: <RouteWrapper><SignInPage /></RouteWrapper> },
      { path: "/sign-up", element: <RouteWrapper><SignUpPage /></RouteWrapper> },
      { path: "/forgot-password", element: <RouteWrapper><ForgotPasswordPage /></RouteWrapper> },
    ],
  },
  {
    path: "/",
    children: [
      { path: "about", element: <RouteWrapper><AboutPage /></RouteWrapper> },
      { path: "features", element: <RouteWrapper><FeaturesPage /></RouteWrapper> },
      { path: "pricing", element: <RouteWrapper><PricingPage /></RouteWrapper> },
      { path: "contact", element: <RouteWrapper><ContactPage /></RouteWrapper> },
    ]
  },

  // ── Protected dashboard routes ─────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RouteWrapper><DashboardLayout /></RouteWrapper>,
        children: [
          { path: "/dashboard", element: <RouteWrapper><DashboardPage /></RouteWrapper> },
          { path: "/documents", element: <RouteWrapper><DocumentsPage /></RouteWrapper> },
          { path: "/upload", element: <RouteWrapper><UploadPage /></RouteWrapper> },
          { path: "/history", element: <RouteWrapper><HistoryPage /></RouteWrapper> },
          { path: "/profile", element: <RouteWrapper><ProfilePage /></RouteWrapper> },
          { path: "/settings", element: <RouteWrapper><SettingsPage /></RouteWrapper> },
          {
            path: "/documents/:id",
            element: <RouteWrapper><DocumentLayout /></RouteWrapper>,
            children: [
              { index: true, element: <RouteWrapper><ChatPage /></RouteWrapper> },
              { path: "chat", element: <RouteWrapper><ChatPage /></RouteWrapper> },
              { path: "notes", element: <RouteWrapper><NotesPage /></RouteWrapper> },
              { path: "summary", element: <RouteWrapper><SummaryPage /></RouteWrapper> },
              { path: "quiz", element: <RouteWrapper><QuizPage /></RouteWrapper> },
              { path: "flashcards", element: <RouteWrapper><FlashcardsPage /></RouteWrapper> },
            ],
          },
        ],
      },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  { path: "*", element: <RouteWrapper><NotFoundPage /></RouteWrapper> },
]);
