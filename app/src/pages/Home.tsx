import { FormEvent, useState } from 'react';
import { streamComplete } from '../services/stream';
import './home.scss';

const Home = () => {
	const [userPrompt, setUserPrompt] = useState('Provide me with a 5 line poem');
	const [response, setResponse] = useState<string[]>([]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		try {
			setResponse((prev) => {
				prev.push(userPrompt);
				prev.push('');
				return prev;
			});
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
			<div id='chat-output'>
				{response.map((resp) =>
					resp
						.split('\\n')
						.map((line, index) => <article key={index}>{line}</article>),
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
