import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export const Settings = () => {
	const { user, login } = useContext(AuthContext);
	const [apiProvider, setApiProvider] = useState('gemini');
	const [geminiApiKey, setGeminiApiKey] = useState('');
	const [ollamaHost, setOllamaHost] = useState('');

	useEffect(() => {
		if (user) {
			const fetchApiKeys = async () => {
				try {
					const apiKeys = await window.db.apiKey.fetchApiKeysForUser(user.id);
					if (apiKeys) {
						const geminiKey = apiKeys.find((k) => k.provider === 'gemini');
						if (geminiKey) {
							setGeminiApiKey(geminiKey.api_key || '');
						}

						const ollamaKey = apiKeys.find((k) => k.provider === 'ollama');
						if (ollamaKey) {
							setOllamaHost(ollamaKey.hostname || '');
						}
					}
				} catch (error) {
					console.error('Failed to fetch API keys:', error);
				}
			};
			fetchApiKeys();
		}
	}, [user]);

	const handleApiSettingsSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;

		try {
			// Upsert Gemini Key
			await window.db.apiKey.upsertApiKey({
				user_id: user.id,
				provider: 'gemini',
				api_key: geminiApiKey,
				hostname: null,
			});

			// Upsert Ollama Host
			await window.db.apiKey.upsertApiKey({
				user_id: user.id,
				provider: 'ollama',
				api_key: '',
				hostname: ollamaHost,
			});

			alert('API settings saved!');
		} catch (error) {
			console.error('Failed to save API settings:', error);
			alert('Failed to save API settings.');
		}
	};

	const handleDarkModeChange = async () => {
		if (user) {
			const newDarkValue = user.dark ? 0 : 1;
			try {
				await window.db.user.updateUser({ id: user.id, dark: newDarkValue });
				login({ ...user, dark: newDarkValue });
			} catch (error) {
				console.error('Failed to update dark mode setting:', error);
				// Optionally, revert the checkbox state or show an error to the user
			}
		}
	};

	if (!user) {
		return <div>Loading user settings...</div>;
	}

	return (
		<div className='container mt-4'>
			<h2>User Settings</h2>
			<div className='card'>
				<div className='card-body'>
					<h5 className='card-title'>Profile Information</h5>
					<p className='card-text'>
						<strong>First Name:</strong> {user.first_name}
					</p>
					<p className='card-text'>
						<strong>Last Name:</strong> {user.last_name}
					</p>
					<p className='card-text'>
						<strong>Email:</strong> {user.email}
					</p>
				</div>
			</div>

			<div className='card mt-3'>
				<div className='card-body'>
					<h5 className='card-title'>Preferences</h5>
					<div className='form-check'>
						<input
							type='checkbox'
							id='dark-mode'
							name='dark-mode'
							className='form-check-input'
							checked={!!user.dark}
							onChange={handleDarkModeChange}
						/>
						<label htmlFor='dark-mode' className='form-check-label'>
							Dark Mode
						</label>
					</div>

					<div className='form-check'>
						<input
							type='checkbox'
							id='notifications'
							name='notifications'
							className='form-check-input'
						/>
						<label htmlFor='notifications' className='form-check-label'>
							Notifications
						</label>
					</div>
				</div>
			</div>

			<div className='card mt-3'>
				<div className='card-body'>
					<h5 className='card-title'>API Credentials</h5>
					<form onSubmit={handleApiSettingsSave}>
						<div className='mb-3'>
							<label className='form-label'>API Provider</label>
							<div className='form-check'>
								<input
									className='form-check-input'
									type='radio'
									name='apiProvider'
									id='gemini'
									value='gemini'
									checked={apiProvider === 'gemini'}
									onChange={(e) => setApiProvider(e.target.value)}
								/>
								<label className='form-check-label' htmlFor='gemini'>
									Gemini
								</label>
							</div>
							<div className='form-check'>
								<input
									className='form-check-input'
									type='radio'
									name='apiProvider'
									id='ollama'
									value='ollama'
									checked={apiProvider === 'ollama'}
									onChange={(e) => setApiProvider(e.target.value)}
								/>
								<label className='form-check-label' htmlFor='ollama'>
									Ollama
								</label>
							</div>
						</div>

						{apiProvider === 'gemini' && (
							<div className='mb-3'>
								<label htmlFor='gemini-api-key' className='form-label'>
									Gemini API Key
								</label>
								<input
									type='password'
									className='form-control'
									id='gemini-api-key'
									value={geminiApiKey}
									onChange={(e) => setGeminiApiKey(e.target.value)}
								/>
							</div>
						)}

						{apiProvider === 'ollama' && (
							<div className='mb-3'>
								<label htmlFor='ollama-host' className='form-label'>
									Ollama Host URL
								</label>
								<input
									type='text'
									className='form-control'
									id='ollama-host'
									value={ollamaHost}
									onChange={(e) => setOllamaHost(e.target.value)}
								/>
							</div>
						)}
						<button type='submit' className='btn btn-primary'>
							Save API Settings
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};
