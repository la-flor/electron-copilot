import React, {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { User } from '../shared/interfaces/database.interface';

interface AuthContextType {
	isAuthenticated: boolean;
	user: Omit<User, 'password'> | null;
	login: (userData: Omit<User, 'password'>) => void;
	logout: () => void;
	isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined,
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const navigate = useNavigate(); // Hook for navigation

	useEffect(() => {
		const storedUser = sessionStorage.getItem('currentUser');
		if (storedUser) {
			try {
				const parsedUser: User = JSON.parse(storedUser);
				setUser(parsedUser);
				setIsAuthenticated(true);
			} catch (error) {
				console.error('Failed to parse stored user:', error);
				sessionStorage.removeItem('currentUser');
			}
		}
		setIsLoading(false);
	}, []);

	const login = (userData: Omit<User, 'password'>) => {
		setIsAuthenticated(true);
		setUser(userData);
		sessionStorage.setItem('currentUser', JSON.stringify(userData));
	};

	const logout = () => {
		setIsAuthenticated(false);
		setUser(null);
		sessionStorage.removeItem('currentUser');
		navigate('/'); // Navigate to login page on logout
	};

	return (
		<AuthContext.Provider
			value={{ isAuthenticated, user, login, logout, isLoading }}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
