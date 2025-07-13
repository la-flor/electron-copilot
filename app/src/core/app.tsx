import { useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import useTheme from '../hooks/useTheme';
import { Automations } from '../pages/Automations';
import Dashboard from '../pages/Dashboard';
import Home from '../pages/Home';
import LoginPage from '../pages/LoginPage';
import { Settings } from '../pages/Settings';
import '../styles/bootstrap-overrides.scss';
import './app.scss';

const root = createRoot(document.body);

// AppWrapper to ensure AuthProvider is within BrowserRouter
const AppWrapper = () => {
	const { user } = useContext(AuthContext);
	useTheme(user);
	return (
		<main>
			<Navbar />
			<Routes>
				<Route path='/' element={<LoginPage />} />
				{/* Protected Routes */}
				<Route element={<ProtectedRoute />}>
					<Route path='/home' element={<Home />} />
					<Route path='/dashboard' element={<Dashboard />} />
					<Route path='/automations' element={<Automations />} />
					<Route path='/settings' element={<Settings />} />
				</Route>
			</Routes>
			<footer>
				<a href='#'>Github</a>
			</footer>
		</main>
	);
};

const App = () => {
	return (
		<BrowserRouter>
			<AuthProvider>
				<AppWrapper />
			</AuthProvider>
		</BrowserRouter>
	);
};

root.render(<App />);
