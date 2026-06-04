import type { ReactElement } from 'react'
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Navigate,
} from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import MyClaims from './pages/MyClaims'
import Submissions from './pages/Submissions'
import ClaimPreview from './pages/ClaimPreview'
import Settings from './pages/Settings'
import CreateClaim from './pages/CreateClaim'
import Login from './pages/Login'
import ClaimDocuments from './pages/ClaimDocuments'
import ClaimDocumentsSummary from './pages/ClaimDocumentsSummary'
import FraudTraining from './pages/FraudTraining'
import AllClaims from './pages/AllClaims'
import PendingClaims from './pages/PendingClaims'
import Profile from './pages/Profile'
import LandingPage from './pages/LandingPage'
import Signup from './pages/Signup'
import FraudAlertsDashboard from './pages/FraudAlertsDashboard'
import FraudAlertDetail from './pages/FraudAlertDetail'
import FraudAlertInvestigate from './pages/FraudAlertInvestigate'
import Reports from './pages/Reports'
import ReportDetail from './pages/ReportDetail'
import 'bootstrap/dist/css/bootstrap.min.css'
import { getToken, hasManagementAccess, isAdmin } from './utils/auth'

function RequireAuth({ children }: { children: ReactElement }) {
  const token = getToken()
  if (!token) {
    return <Navigate to='/login' replace />
  }
  return children
}

function PublicOnly({ children }: { children: ReactElement }) {
  const token = getToken()
  if (token) {
    return <Navigate to='/dashboard' replace />
  }
  return children
}

function RequireManagementAccess({ children }: { children: ReactElement }) {
  if (!hasManagementAccess()) {
    return <Navigate to='/dashboard' replace />
  }
  return children
}

function RequireAdminAccess({ children }: { children: ReactElement }) {
  if (!isAdmin()) {
    return <Navigate to='/dashboard' replace />
  }
  return children
}

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route
          path='/'
          element={
            <PublicOnly>
              <LandingPage />
            </PublicOnly>
          }
        />
        <Route
          path='/login'
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path='/signup'
          element={
            <PublicOnly>
              <Signup />
            </PublicOnly>
          }
        />
        <Route
          path='/'
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route path='/dashboard' element={<Dashboard />} />
          <Route
            path='/all-claims'
            element={
              <RequireManagementAccess>
                <AllClaims />
              </RequireManagementAccess>
            }
          />
          <Route
            path='/pending-claims'
            element={
              <RequireManagementAccess>
                <PendingClaims />
              </RequireManagementAccess>
            }
          />
          <Route path='/my-claims' element={<MyClaims />} />
          <Route
            path='/submissions'
            element={
              <RequireManagementAccess>
                <Submissions />
              </RequireManagementAccess>
            }
          />
          <Route path='/claims/:id' element={<ClaimPreview />} />
          <Route path='/claims/:id/edit' element={<CreateClaim />} />
          <Route path='/claims/:id/documents' element={<ClaimDocuments />} />
          <Route path='/claims/:id/documents/summary' element={<ClaimDocumentsSummary />} />
          <Route path='/profile' element={<Profile />} />
          <Route
            path='/settings'
            element={
              <RequireAdminAccess>
                <Settings />
              </RequireAdminAccess>
            }
          />
          <Route path='/create-claim' element={<CreateClaim />} />
          <Route
            path='/fraud-training'
            element={
              <RequireAdminAccess>
                <FraudTraining />
              </RequireAdminAccess>
            }
          />
          <Route
            path='/fraud-alerts'
            element={
              <RequireManagementAccess>
                <FraudAlertsDashboard />
              </RequireManagementAccess>
            }
          />
          <Route
            path='/fraud-alerts/:fraudScoreId'
            element={
              <RequireManagementAccess>
                <FraudAlertDetail />
              </RequireManagementAccess>
            }
          />
          <Route
            path='/fraud-alerts/:fraudScoreId/investigate'
            element={
              <RequireManagementAccess>
                <FraudAlertInvestigate />
              </RequireManagementAccess>
            }
          />
          <Route
            path='/reports'
            element={
              <RequireManagementAccess>
                <Reports />
              </RequireManagementAccess>
            }
          />
          <Route
            path='/reports/:reportType'
            element={
              <RequireManagementAccess>
                <ReportDetail />
              </RequireManagementAccess>
            }
          />
        </Route>
      </>,
    ),
  )

  return <RouterProvider router={router} />
}

export default App
