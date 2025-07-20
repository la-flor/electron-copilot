import { FormEvent, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { streamComplete } from '../services/stream';
import { OllamaModel } from '../shared/interfaces/database.interface';
import './home.scss';

interface ChatMessage {
	sender: 'user' | 'ai';
	text: string;
	model: string;
	provider: string;
}

const Home = () => {
	const { user } = useContext(AuthContext);
	const [provider, setProvider] = useState('gemini');
	const [models, setModels] = useState<OllamaModel[]>([]);
	const [model, setModel] = useState('gemini-pro');
	const [userPrompt, setUserPrompt] = useState('Provide me with a 5 line poem');
	const [response, setResponse] = useState<ChatMessage[]>([]);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		const fetchModels = async () => {
			if (!user) return;
			setError('');
			setModels([]);

			if (provider === 'ollama') {
				setModel(''); // Reset model when provider changes
				const res = await window.db.ollama.listModels(user.id);
				if (res.success && res.models) {
					setModels(res.models);
					if (res.models.length > 0) {
						setModel(res.models[0].name);
					}
				} else {
					setError('Failed to fetch Ollama models.');
					console.error(res.message || 'Failed to fetch Ollama models.');
				}
			} else if (provider === 'gemini') {
				// For Gemini, we can have a static list or a single option.
				setModel('gemini-pro'); // Example model
				setModels([]); // Or a static list: [{ name: 'gemini-pro', ... }]
			}
		};

		fetchModels();
	}, [provider, user]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!model) {
			alert('Please select a model.');
			return;
		}
		try {
			const userMessage: ChatMessage = {
				sender: 'user',
				text: userPrompt,
				provider,
				model,
			};

			const aiMessagePlaceholder: ChatMessage = {
				sender: 'ai',
				text: '',
				provider,
				model,
			};
			setResponse((prev) => [...prev, userMessage, aiMessagePlaceholder]);
			setUserPrompt('');
			// The streamComplete function will need to be updated to accept provider and model.
			// For now, this will continue to use the default.
			// for await (const { chunk } of streamComplete(userPrompt, { provider, model })) {
			for await (const { chunk } of streamComplete(userPrompt)) {
				setResponse((prev) => {
					if (prev.length === 0) {
						return [];
					}
					const lastMessage = prev[prev.length - 1];
					const updatedLastMessage = {
						...lastMessage,
						text: lastMessage.text + chunk,
					};
					return [...prev.slice(0, -1), updatedLastMessage];
				});
			}
		} catch (err) {
			console.log(err);
		}
	};

	return (
		<div id='home'>
			<div id='chat-controls' className='d-flex gap-2 p-2'>
				<div className='flex-grow-1'>
					<label htmlFor='provider-select' className='form-label'>
						Provider
					</label>
					<select
						id='provider-select'
						className='form-select'
						value={provider}
						onChange={(e) => setProvider(e.target.value)}
					>
						<option value='gemini'>Gemini</option>
						<option value='ollama'>Ollama</option>
					</select>
				</div>
				<div className='flex-grow-1'>
					<label htmlFor='model-select' className='form-label'>
						Model
					</label>
					<select
						id='model-select'
						className='form-select'
						value={model}
						onChange={(e) => setModel(e.target.value)}
						disabled={provider === 'gemini' || models.length === 0}
					>
						{provider === 'gemini' ? (
							<option value='gemini-pro'>gemini-pro</option>
						) : (
							models.map((m) => (
								<option key={m.digest} value={m.name}>
									{m.name}
								</option>
							))
						)}
					</select>
				</div>
			</div>
			{error && <div className='alert alert-danger mx-2'>{error}</div>}
			<div id='chat-output' className='p-3'>
				{response.map((message, i) => (
					<div
						key={i}
						className={`d-flex mb-2 ${
							message.sender === 'user'
								? 'justify-content-end'
								: 'justify-content-start'
						}`}
					>
						<div
							className={`card ${
								message.sender === 'user'
									? 'bg-primary text-white'
									: 'bg-light text-dark'
							}`}
							style={{ maxWidth: '70%', borderRadius: '1rem' }}
						>
							<div className='card-body py-2 px-3'>
								<p className='card-text' style={{ whiteSpace: 'pre-wrap' }}>
									{message.text}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>

			<form onSubmit={handleSubmit}>
				<textarea
					id='chat-input'
					rows={4}
					value={userPrompt}
					onChange={(e) => setUserPrompt(e.target.value)}
					placeholder='Type your message here...'
				></textarea>

				<button
					id='user-submit'
					type='submit'
					className='btn btn-primary btn-lg'
				>
					Send
				</button>
			</form>
		</div>
	);
};

export default Home;
