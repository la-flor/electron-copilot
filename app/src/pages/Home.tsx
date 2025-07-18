import { FormEvent, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { OllamaModel } from '../shared/interfaces/database.interface';
import { streamComplete } from '../services/stream';
import './home.scss';

const Home = () => {
	const { user } = useContext(AuthContext);
	const [provider, setProvider] = useState('gemini');
	const [models, setModels] = useState<OllamaModel[]>([]);
	const [model, setModel] = useState('gemini-pro');
	const [userPrompt, setUserPrompt] = useState('Provide me with a 5 line poem');
	const [response, setResponse] = useState<string[]>([]);
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
					setError(res.message || 'Failed to fetch Ollama models.');
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
			setResponse((prev) => [
				...prev,
				`\n> **Me (using ${provider}/${model}):**\n${userPrompt}\n\n**${model}:**`,
				'',
			]);
			setUserPrompt('');
			// The streamComplete function will need to be updated to accept provider and model.
			// For now, this will continue to use the default.
			// for await (const { chunk } of streamComplete(userPrompt, { provider, model })) {
			for await (const { chunk } of streamComplete(userPrompt)) {
				setResponse((prev) => {
					if (prev.length === 0) {
						return [chunk];
					}
					const lastIdx = prev.length - 1;
					return [...prev.slice(0, lastIdx), prev[lastIdx] + chunk];
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
			<div id='chat-output'>
				{response.map((resp, i) =>
					resp
						.split('\n')
						.map((line, j) => <article key={`${i}-${j}`}>{line}</article>),
				)}
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
