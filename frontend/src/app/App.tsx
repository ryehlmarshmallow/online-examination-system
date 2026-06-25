import { lazy, Suspense } from "react"
import type { ComponentType } from "react"
import {
  createBrowserRouter,
  Navigate,
  RouterProvider
} from "react-router-dom"
import { RequireAuth } from "@/app/guards/require-auth"
import { RequireGuest } from "@/app/guards/require-guest"
import { RequirePendingVerificationEmail } from "@/app/guards/require-pending-verification-email"
import { AuthenticatedLayout } from "@/app/layouts/authenticated-layout"
import { LoginPage } from "@/features/auth/pages/login-page"
import { SignupPage } from "@/features/auth/pages/signup-page"
import { SignupVerifyPage } from "@/features/auth/pages/signup-verify-page"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { LandingPage } from "@/features/landing/pages/landing-page"

import { Toaster } from "@/shared/components/ui/sonner"
import { ExamLayout } from "@/features/exams/components/exam-layout"
import { Spinner } from "@/shared/components/ui/spinner"

// Lazy loaded page components
const DashboardPage = lazy(() => import("@/features/dashboard/pages/dashboard-page").then(m => ({ default: m.DashboardPage })))
const NotificationPage = lazy(() => import("@/features/notifications/pages/notification-page").then(m => ({ default: m.NotificationPage })))
const ClassroomListPage = lazy(() => import("@/features/classrooms/pages/classroom-list-page").then(m => ({ default: m.ClassroomListPage })))
const ClassroomInvitePage = lazy(() => import("@/features/classrooms/pages/classroom-invite-page").then(m => ({ default: m.ClassroomInvitePage })))
const ClassroomDetailPage = lazy(() => import("@/features/classrooms/pages/classroom-detail-page").then(m => ({ default: m.ClassroomDetailPage })))
const ClassroomMembersPage = lazy(() => import("@/features/classrooms/pages/classroom-members-page").then(m => ({ default: m.ClassroomMembersPage })))
const ClassroomInvitationsPage = lazy(() => import("@/features/classrooms/pages/classroom-invitations-page").then(m => ({ default: m.ClassroomInvitationsPage })))
const ClassroomStatsPage = lazy(() => import("@/features/classrooms/pages/classroom-stats-page").then(m => ({ default: m.ClassroomStatsPage })))

const ExamSummaryPage = lazy(() => import("@/features/exams/pages/exam-summary-page").then(m => ({ default: m.ExamSummaryPage })))
const ExamMyAttemptsPage = lazy(() => import("@/features/exams/pages/exam-my-attempts-page").then(m => ({ default: m.ExamMyAttemptsPage })))
const ExamAllSubmissionsPage = lazy(() => import("@/features/exams/pages/exam-all-submissions-page").then(m => ({ default: m.ExamAllSubmissionsPage })))
const ExamEditorPage = lazy(() => import("@/features/exams/pages/exam-editor-page").then(m => ({ default: m.ExamEditorPage })))
const ExamAttemptPage = lazy(() => import("@/features/exams/pages/exam-attempt-page").then(m => ({ default: m.ExamAttemptPage })))

const QuestionSetExplorerPage = lazy(() => import("@/features/questionsets/pages/question-set-explorer-page").then(m => ({ default: m.QuestionSetExplorerPage })))
const QuestionSetEditorPage = lazy(() => import("@/features/questionsets/pages/question-set-editor-page").then(m => ({ default: m.QuestionSetEditorPage })))

const ProfileSettingsPage = lazy(() => import("@/features/settings/pages/profile-settings-page").then(m => ({ default: m.ProfileSettingsPage })))
const NotificationSettingsPage = lazy(() => import("@/features/settings/pages/notification-settings-page").then(m => ({ default: m.NotificationSettingsPage })))
const PreferencesSettingsPage = lazy(() => import("@/features/settings/pages/preferences-settings-page").then(m => ({ default: m.PreferencesSettingsPage })))
const SecuritySettingsPage = lazy(() => import("@/features/settings/pages/security-settings-page").then(m => ({ default: m.SecuritySettingsPage })))

interface SuspendedProps<P extends object> {
  component: ComponentType<P>
}

function Suspended<P extends object>({
  component: Component,
  ...props
}: SuspendedProps<P> & P) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full min-h-[50vh] items-center justify-center p-8">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      }
    >
      <Component {...(props as P)} />
    </Suspense>
  )
}

function HomeRedirect() {
  const authUser = useAuthStore((state) => state.authUser)
  return authUser ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRedirect />,
  },
  {
    element: <RequireGuest />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "signup",
        element: <SignupPage />,
      },
      {
        element: <RequirePendingVerificationEmail />,
        children: [
          {
            path: "signup/verify",
            element: <SignupVerifyPage />,
          },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AuthenticatedLayout />,
        children: [
          {
            path: "dashboard",
            element: <Suspended component={DashboardPage} />,
          },
          {
            path: "notifications",
            element: <Suspended component={NotificationPage} />,
          },
          {
            path: "classrooms",
            element: <Suspended component={ClassroomListPage} />,
          },
          {
            path: "classrooms/invite/:inviteId",
            element: <Suspended component={ClassroomInvitePage} type="user" />,
          },
          {
            path: "classrooms/join/:token",
            element: <Suspended component={ClassroomInvitePage} type="link" />,
          },
          {
            path: "classrooms/:classroomId",
            children: [
              {
                index: true,
                element: <Suspended component={ClassroomDetailPage} />,
              },
              {
                path: "members",
                element: <Suspended component={ClassroomMembersPage} />,
              },
              {
                path: "invitations",
                element: <Suspended component={ClassroomInvitationsPage} />,
              },
              {
                path: "stats",
                element: <Suspended component={ClassroomStatsPage} />,
              },
              {
                path: "exams/:examId",
                children: [
                  {
                    element: <ExamLayout />,
                    children: [
                      {
                        index: true,
                        element: <Suspended component={ExamSummaryPage} />,
                      },
                      {
                        path: "attempts",
                        element: <Suspended component={ExamMyAttemptsPage} />,
                      },
                      {
                        path: "submissions",
                        element: <Suspended component={ExamAllSubmissionsPage} />,
                      },
                    ],
                  },
                  {
                    path: "edit",
                    element: <Suspended component={ExamEditorPage} />,
                  },
                  {
                    path: "attempts/:attemptId",
                    element: <Suspended component={ExamAttemptPage} />,
                  },
                ],
              },
            ],
          },
          {
            path: "pools",
            children: [
              {
                index: true,
                element: <Suspended component={QuestionSetExplorerPage} />,
              },
              {
                path: "f/:folderId",
                element: <Suspended component={QuestionSetExplorerPage} />,
              },
              {
                path: ":poolId",
                element: <Suspended component={QuestionSetEditorPage} />,
              },
            ],
          },
          {
            path: "templates",
            children: [
              {
                index: true,
                element: <Suspended component={QuestionSetExplorerPage} />,
              },
              {
                path: "f/:folderId",
                element: <Suspended component={QuestionSetExplorerPage} />,
              },
              {
                path: ":templateId",
                element: <Suspended component={QuestionSetEditorPage} />,
              },
            ],
          },
          {
            path: "settings",
            children: [
              {
                index: true,
                element: <Navigate to="profile" replace />,
              },
              {
                path: "profile",
                element: <Suspended component={ProfileSettingsPage} />,
              },
              {
                path: "notifications",
                element: <Suspended component={NotificationSettingsPage} />,
              },
              {
                path: "preferences",
                element: <Suspended component={PreferencesSettingsPage} />,
              },
              {
                path: "security",
                element: <Suspended component={SecuritySettingsPage} />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <HomeRedirect />,
  },
])

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}

export default App
