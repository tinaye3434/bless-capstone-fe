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
import 'bootstrap/dist/css/bootstrap.min.css'
import { getToken } from './utils/auth'

function RequireAuth({ children }: { children: ReactElement }) {
  const token = getToken()
  if (!token) {
    return <Navigate to='/login' replace />
  }
  return children
}

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path='/login' element={<Login />} />
        <Route
          path='/'
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path='/all-claims' element={<AllClaims />} />
          <Route path='/pending-claims' element={<PendingClaims />} />
          <Route path='/my-claims' element={<MyClaims />} />
          <Route path='/submissions' element={<Submissions />} />
          <Route path='/claims/:id' element={<ClaimPreview />} />
          <Route path='/claims/:id/edit' element={<CreateClaim />} />
          <Route path='/claims/:id/documents' element={<ClaimDocuments />} />
          <Route path='/claims/:id/documents/summary' element={<ClaimDocumentsSummary />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/create-claim' element={<CreateClaim />} />
          <Route path='/fraud-training' element={<FraudTraining />} />
        </Route>
      </>,
    ),
  )

  return <RouterProvider router={router} />
}

export default App
