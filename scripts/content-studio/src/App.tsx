import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Generation from './pages/Generation'
import Browser from './pages/Browser'
import ProfileDetail from './pages/ProfileDetail'
import TeamDetail from './pages/TeamDetail'
import Settings from './pages/Settings'
import { StudioProvider } from './context/StudioContext'

export default function App() {
  return (
    <StudioProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/generation" element={<Generation />} />
            <Route path="/browser" element={<Browser />} />
            <Route path="/profile/:category/:id" element={<ProfileDetail />} />
            <Route path="/team/:id" element={<TeamDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </StudioProvider>
  )
}
