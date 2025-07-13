import { useEffect, useState } from 'react';
import RefreshButton from './RefreshBtn';

export interface Model {
	name: string;
	modified_at: string;
	size: number;
	digest: string;
	details: {
		format: string;
		family: string;
		families: string | null;
		parameter_size: string;
		quantization_level: string;
	};
}

const Models = () => {
	const [models, setModels] = useState<{ updateTime: number; models: Model[] }>(
		{ updateTime: 0, models: [] },
	);

	const fetchModels = async () => {
		const response = await fetch('http://localhost:11434/api/tags');
		const { models }: { models: Model[] } = await response.json();
		setModels({ updateTime: new Date().getTime(), models });
	};

	useEffect(() => {
		fetchModels();
	}, []);

	return (
		<>
			<div>
				<div className='w-75 d-flex justify-content-between align-items-center'>
					<h2>Models</h2>
					<RefreshButton onClick={async () => await fetchModels()} />
				</div>

				{models.updateTime ? (
					<h3 className='fs-6 text-muted'>
						(Last Updated: {new Date(models.updateTime).toLocaleString()})
					</h3>
				) : null}
			</div>
			<ul>
				{models.models.length ? (
					models.models.map((model) => <li key={model.name}>{model.name}</li>)
				) : (
					<li>No models available</li>
				)}
			</ul>
		</>
	);
};

export default Models;
