import Models from '../components/Models';
import RunningModels from '../components/RunningModels';

const Dashboard = () => {
	return (
		<div className='container px-3 pt-5'>
			<div className='row'>
				<div className='col'>
					<Models />
				</div>

				<div className='col'>
					<RunningModels />
				</div>
			</div>

			<br />
			<br />

			<div className='row'>
				<div className='col'>
					<h1>To Do:</h1>

					<div className='d-flex flex-column'>
						<div className='form-check'>
							<input
								type='checkbox'
								id='history'
								name='history'
								className='form-check-input'
							/>
							<label htmlFor='history' className='form-check-label'>
								History
							</label>
						</div>

						<div className='form-check'>
							<input
								type='checkbox'
								id='tokens'
								name='tokens'
								className='form-check-input'
							/>
							<label htmlFor='tokens' className='form-check-label'>
								Tokens
							</label>
						</div>

						<div className='form-check'>
							<input
								type='checkbox'
								id='queries-over-time'
								name='queries-over-time'
								className='form-check-input'
							/>
							<label htmlFor='queries-over-time' className='form-check-label'>
								Queries Over Time
							</label>
						</div>

						<div className='form-check'>
							<input
								type='checkbox'
								id='saved-prompts'
								name='saved-prompts'
								className='form-check-input'
							/>
							<label htmlFor='saved-prompts' className='form-check-label'>
								Saved Prompts
							</label>
						</div>

						<div className='form-check'>
							<input
								type='checkbox'
								id='saved-responses'
								name='saved-responses'
								className='form-check-input'
							/>
							<label htmlFor='saved-responses' className='form-check-label'>
								Saved Responses
							</label>
						</div>

						<div className='form-check'>
							<input
								type='checkbox'
								id='ollama-status'
								name='ollama-status'
								className='form-check-input'
								checked={true}
							/>
							<label htmlFor='ollama-status' className='form-check-label'>
								Running Models
							</label>
						</div>

						<div className='form-check'>
							<input
								type='checkbox'
								id='models-available'
								name='models-available'
								className='form-check-input'
								defaultChecked
							/>
							<label htmlFor='models-available' className='form-check-label'>
								Models Available in Ollama
							</label>
						</div>

						<div className='form-check'>
							<input
								type='checkbox'
								id='file-system'
								name='file-system'
								className='form-check-input'
							/>
							<label htmlFor='file-system' className='form-check-label'>
								File System (maybe we can have a file system for generated text
								or pdf documents)
							</label>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
