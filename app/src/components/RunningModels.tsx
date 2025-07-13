import { useEffect, useState } from 'react';
import RefreshButton from './RefreshBtn';

interface ActiveModel {
	name: string;
	model: string;
	size: number;
	digest: string;
	details: {
		parent_model: string;
		format: string;
		family: string;
		families: string[];
		parameter_size: string;
		quantization_level: string;
	};
	expires_at: string;
	size_vram: number;
}

const RunningModels = () => {
	const [models, setModels] = useState<{
		updateTime: number;
		models: ActiveModel[];
	}>({ updateTime: 0, models: [] });

	const fetchModels = async () => {
		const response = await fetch('http://localhost:11434/api/ps');
		const { models }: { models: ActiveModel[] } = await response.json();
		setModels({ updateTime: new Date().getTime(), models });
	};

	useEffect(() => {
		fetchModels();
	}, []);

	return (
		<>
			<div>
				<div className='w-75 d-flex justify-content-between align-items-center'>
					<h2>Running Models</h2>
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
					models.models.map((model) => (
						<li key={model.name}>
							{model.name}{' '}
							<span className='text-danger'>
								(expires {new Date(model.expires_at).toDateString()})
							</span>
						</li>
					))
				) : (
					<li>No models running</li>
				)}
			</ul>
		</>
	);
};

export default RunningModels;
