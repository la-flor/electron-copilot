import { useEffect } from 'react';
import { User } from '../shared/interfaces/database.interface';

const useTheme = (user: User | null) => {
	useEffect(() => {
		const htmlElement = document.documentElement;

		const applyTheme = () => {
			if (user) {
				// If user is logged in, use their preference
				htmlElement.dataset.bsTheme = user.dark ? 'dark' : 'light';
			} else {
				// Otherwise, use OS preference
				const osTheme = window.matchMedia('(prefers-color-scheme: dark)')
					.matches
					? 'dark'
					: 'light';
				htmlElement.dataset.bsTheme = osTheme;
			}
		};

		// Apply theme on mount and when user changes
		applyTheme();

		// Listen for OS theme changes to apply them when no user is logged in
		const handleOsThemeChange = (e: MediaQueryListEvent) => {
			if (!user) {
				htmlElement.dataset.bsTheme = e.matches ? 'dark' : 'light';
			}
		};

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', handleOsThemeChange);

		// Cleanup listener on component unmount
		return () => {
			mediaQuery.removeEventListener('change', handleOsThemeChange);
		};
	}, [user]); // Rerun effect if user object changes
};

export default useTheme;
