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
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchModels = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await fetch('http://localhost:11434/api/ps');
			const { models }: { models: ActiveModel[] } = await response.json();
			setModels({ updateTime: new Date().getTime(), models });
		} catch (err) {
			setError(
				'Failed to fetch running models. Please check if Ollama is running.',
			);
			console.error('Failed to fetch running models:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchModels();

		// Refresh running models every 30 seconds
		const intervalId = setInterval(fetchModels, 30000);

		return () => clearInterval(intervalId);
	}, []);

	// Format memory usage in a human-readable way
	const formatMemory = (bytes: number) => {
		if (bytes === 0) return '0 MB';
		const mb = bytes / (1024 * 1024);
		if (mb < 1024) {
			return `${mb.toFixed(2)} MB`;
		} else {
			return `${(mb / 1024).toFixed(2)} GB`;
		}
	};

	// Calculate time until expiration
	const getExpiresIn = (expiresAt: string) => {
		const expireTime = new Date(expiresAt).getTime();
		const now = new Date().getTime();
		const diffMs = expireTime - now;

		if (diffMs <= 0) return 'Expired';

		const diffMins = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMins / 60);

		if (diffHours > 0) {
			const remainingMins = diffMins % 60;
			return `${diffHours}h ${remainingMins}m`;
		} else {
			return `${diffMins}m`;
		}
	};

	// Get badge style based on expiration time
	const getExpiryBadgeStyle = (expiresAt: string) => {
		const expireTime = new Date(expiresAt).getTime();
		const now = new Date().getTime();
		const diffMs = expireTime - now;

		// Less than 5 minutes
		if (diffMs <= 5 * 60 * 1000) return 'danger';

		// Less than 30 minutes
		if (diffMs <= 30 * 60 * 1000) return 'warning';

		return 'success';
	};

	return (
		<div className='card'>
			<div className='card-header'>
				<div className='d-flex justify-content-between align-items-center'>
					<h4 className='mb-0'>Running Models</h4>
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
						<div className='row row-cols-1 row-cols-md-2 g-4'>
							{models.models.map((model) => (
								<div key={model.digest} className='col'>
									<div className='card h-100 shadow-sm'>
										<div className='card-header'>
											<div className='d-flex align-items-center'>
												<span
													className={`badge bg-${getExpiryBadgeStyle(model.expires_at)} me-2`}
												></span>
												<h5 className='mb-0 text-truncate'>{model.name}</h5>
											</div>
										</div>
										<div className='card-body'>
											<table className='table table-borderless table-sm mb-0'>
												<tbody>
													<tr>
														<td className='text-muted fw-medium' width='40%'>
															Family
														</td>
														<td>{model.details.family || '-'}</td>
													</tr>
													<tr>
														<td className='text-muted fw-medium'>Parameters</td>
														<td>{model.details.parameter_size || '-'}</td>
													</tr>
													<tr>
														<td className='text-muted fw-medium'>VRAM Usage</td>
														<td>{formatMemory(model.size_vram)}</td>
													</tr>
													<tr>
														<td className='text-muted fw-medium'>
															Quantization
														</td>
														<td>{model.details.quantization_level || '-'}</td>
													</tr>
													<tr>
														<td className='text-muted fw-medium'>Expires in</td>
														<td>
															<span
																className={`badge bg-${getExpiryBadgeStyle(model.expires_at)}`}
															>
																{getExpiresIn(model.expires_at)}
															</span>
														</td>
													</tr>
												</tbody>
											</table>
										</div>
									</div>
								</div>
							))}
						</div>
					</>
				) : (
					<div className='text-center p-4'>
						<p className='lead'>No models currently running</p>
						<p className='text-muted'>
							Running models will appear here when you start using them.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default RunningModels;
