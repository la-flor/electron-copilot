import { useContext, useEffect, useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { AuthContext } from '../context/AuthContext';

interface TokenUsageByDate {
	date: string;
	input_tokens: number;
	output_tokens: number;
	total_tokens: number;
}

interface ModelUsageData {
	model: string;
	total_tokens: number;
}

const COLORS = [
	'#8884d8',
	'#82ca9d',
	'#ffc658',
	'#ff8042',
	'#0088fe',
	'#00C49F',
	'#FFBB28',
	'#FF8042',
];

const TokenUsageChart = () => {
	const { user } = useContext(AuthContext);
	const [tokenDataByDate, setTokenDataByDate] = useState<TokenUsageByDate[]>(
		[],
	);
	const [tokenDataByModel, setTokenDataByModel] = useState<ModelUsageData[]>(
		[],
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'daily' | 'model'>('daily');

	useEffect(() => {
		const fetchTokenUsage = async () => {
			if (!user) {
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);

				// Calculate date range (last 7 days)
				const today = new Date();
				const startDate = new Date(today);
				startDate.setDate(startDate.getDate() - 6); // Last 7 days including today

				const formattedStartDate = startDate.toISOString().split('T')[0];
				const formattedEndDate = today.toISOString().split('T')[0];

				// Fetch token usage data by date
				const dateResult = await window.db.tokenUsage.getTokenUsageByDate(
					user.id,
					formattedStartDate,
					formattedEndDate,
				);

				if (dateResult.success && dateResult.data) {
					// Fill in any missing dates with zero values
					const filledData = fillMissingDates(
						dateResult.data,
						formattedStartDate,
						formattedEndDate,
					);
					setTokenDataByDate(filledData);
				} else {
					setError(
						dateResult.message || 'Failed to load token usage data by date',
					);
					return;
				}

				// Fetch token usage by model
				const modelResult = await window.db.tokenUsage.getTokenUsageByModel(
					user.id,
				);

				if (modelResult.success && modelResult.data) {
					setTokenDataByModel(modelResult.data);
				} else {
					setError(
						modelResult.message || 'Failed to load token usage data by model',
					);
				}
			} catch (err) {
				console.error('Error fetching token usage:', err);
				setError('An error occurred while fetching token usage data');
			} finally {
				setLoading(false);
			}
		};

		fetchTokenUsage();
	}, [user]);

	// Helper function to fill in missing dates with zero values
	const fillMissingDates = (
		data: TokenUsageByDate[],
		startDateStr: string,
		endDateStr: string,
	) => {
		const filledData: TokenUsageByDate[] = [];
		const startDate = new Date(startDateStr);
		const endDate = new Date(endDateStr);

		// Create a map of existing data by date
		const dataByDate = new Map<string, TokenUsageByDate>();
		data.forEach((item) => {
			dataByDate.set(item.date, item);
		});

		// Fill in all dates in the range
		const currentDate = new Date(startDate);
		while (currentDate <= endDate) {
			const dateStr = currentDate.toISOString().split('T')[0];

			if (dataByDate.has(dateStr)) {
				filledData.push(dataByDate.get(dateStr)!);
			} else {
				filledData.push({
					date: dateStr,
					input_tokens: 0,
					output_tokens: 0,
					total_tokens: 0,
				});
			}

			currentDate.setDate(currentDate.getDate() + 1);
		}

		return filledData;
	};

	if (loading) {
		return <div>Loading token usage data...</div>;
	}

	if (error) {
		return <div className='alert alert-danger'>{error}</div>;
	}

	if (!tokenDataByDate.length && !tokenDataByModel.length) {
		return <div>No token usage data available.</div>;
	}

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<div className='card'>
			<div className='card-header'>
				<ul className='nav nav-tabs card-header-tabs'>
					<li className='nav-item'>
						<a
							className={`nav-link ${activeTab === 'daily' ? 'active' : ''}`}
							href='#daily'
							onClick={(e) => {
								e.preventDefault();
								setActiveTab('daily');
							}}
						>
							Daily Usage
						</a>
					</li>
					<li className='nav-item'>
						<a
							className={`nav-link ${activeTab === 'model' ? 'active' : ''}`}
							href='#model'
							onClick={(e) => {
								e.preventDefault();
								setActiveTab('model');
							}}
						>
							Usage by Model
						</a>
					</li>
				</ul>
			</div>
			<div className='card-body'>
				{activeTab === 'daily' ? (
					<div>
						<h5 className='card-title'>Daily Token Usage (Last 7 Days)</h5>
						{tokenDataByDate.length > 0 ? (
							<ResponsiveContainer width='100%' height={300}>
								<BarChart
									data={tokenDataByDate}
									margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
								>
									<CartesianGrid strokeDasharray='3 3' />
									<XAxis dataKey='date' tickFormatter={formatDate} />
									<YAxis />
									<Tooltip
										formatter={(value: number) => value.toLocaleString()}
										labelFormatter={(label) => formatDate(label)}
									/>
									<Legend />
									<Bar
										dataKey='input_tokens'
										name='Input Tokens'
										stackId='a'
										fill='#82ca9d'
									/>
									<Bar
										dataKey='output_tokens'
										name='Output Tokens'
										stackId='a'
										fill='#8884d8'
									/>
								</BarChart>
							</ResponsiveContainer>
						) : (
							<div>No daily usage data available</div>
						)}
					</div>
				) : (
					<div>
						<h5 className='card-title'>Token Usage by Model</h5>
						{tokenDataByModel.length > 0 ? (
							<div className='row'>
								<div className='col-md-6'>
									<ResponsiveContainer width='100%' height={300}>
										<PieChart>
											<Pie
												data={tokenDataByModel}
												cx='50%'
												cy='50%'
												labelLine={false}
												label={({ name, percent }) =>
													`${name}: ${(percent * 100).toFixed(0)}%`
												}
												outerRadius={80}
												fill='#8884d8'
												dataKey='total_tokens'
												nameKey='model'
											>
												{tokenDataByModel.map((entry, index) => (
													<Cell
														key={`cell-${index}`}
														fill={COLORS[index % COLORS.length]}
													/>
												))}
											</Pie>
											<Tooltip formatter={(value) => value.toLocaleString()} />
											<Legend />
										</PieChart>
									</ResponsiveContainer>
								</div>
								<div className='col-md-6'>
									<ResponsiveContainer width='100%' height={300}>
										<BarChart
											layout='vertical'
											data={tokenDataByModel}
											margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
										>
											<CartesianGrid strokeDasharray='3 3' />
											<XAxis type='number' />
											<YAxis dataKey='model' type='category' scale='band' />
											<Tooltip formatter={(value) => value.toLocaleString()} />
											<Legend />
											<Bar
												dataKey='total_tokens'
												name='Total Tokens'
												fill='#8884d8'
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>
						) : (
							<div>No model usage data available</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default TokenUsageChart;
