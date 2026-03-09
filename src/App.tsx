import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import CreateClaim from './pages/CreateClaim'
import 'bootstrap/dist/css/bootstrap.min.css'

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path='/' element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path='/all-claims' element={<Dashboard />} />
        <Route path='/settings' element={<Settings />} />
        <Route path='/create-claim' element={<CreateClaim />} />
      </Route>,
    ),
  )

  return <RouterProvider router={router} />
}

export default App
