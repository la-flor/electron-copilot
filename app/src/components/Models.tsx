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
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchModels = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await fetch('http://localhost:11434/api/tags');
			const { models }: { models: Model[] } = await response.json();
			setModels({ updateTime: new Date().getTime(), models });
		} catch (err) {
			setError('Failed to fetch models. Please check if Ollama is running.');
			console.error('Failed to fetch models:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchModels();
	}, []);

	// Format file size to human readable format
	const formatBytes = (bytes: number, decimals = 2) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	};

	// Format date to readable format
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString();
	};

	return (
		<div className='card'>
			<div className='card-header'>
				<div className='d-flex justify-content-between align-items-center'>
					<h4 className='mb-0'>Available Models</h4>
					<RefreshButton onClick={fetchModels} />
				</div>
			</div>
			<div className='card-body'>
				{error && <div className='alert alert-danger'>{error}</div>}

				{loading ? (
					<div className='d-flex justify-content-center'>
						<div className='spinner-border text-primary' role='status'>
							<span className='visually-hidden'>Loading...</span>
						</div>
					</div>
				) : models.models.length > 0 ? (
					<>
						<div className='text-muted small text-end mb-3'>
							Last updated: {new Date(models.updateTime).toLocaleString()}
						</div>
						<div className='table-responsive'>
							<table className='table table-hover align-middle'>
								<thead>
									<tr>
										<th>Model</th>
										<th>Family</th>
										<th>Parameters</th>
										<th>Size</th>
										<th>Modified</th>
									</tr>
								</thead>
								<tbody>
									{models.models.map((model) => (
										<tr key={model.digest}>
											<td>
												<div className='fw-bold'>{model.name}</div>
												<div className='small text-muted'>
													{model.details.quantization_level}
												</div>
											</td>
											<td>{model.details.family || '-'}</td>
											<td>{model.details.parameter_size || '-'}</td>
											<td>{formatBytes(model.size)}</td>
											<td>{formatDate(model.modified_at)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</>
				) : (
					<div className='text-center p-4'>
						<p className='lead'>No models available</p>
						<p className='text-muted'>
							Please make sure Ollama is running and has models installed.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Models;
