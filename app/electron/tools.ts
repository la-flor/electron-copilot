import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const weatherTool = new DynamicStructuredTool({
	name: 'get_weather',
	description: 'Get the current weather for a specified location.',
	schema: z.object({
		location: z
			.string()
			.describe('The city and state, e.g., San Francisco, CA'),
	}),
	func: async ({ location }) => {
		try {
			// 1. Geocode location to get latitude and longitude
			const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
				location,
			)}&count=1`;
			const geocodeResponse = await fetch(geocodeUrl);
			if (!geocodeResponse.ok) {
				return `Error: Unable to geocode location. API status: ${geocodeResponse.status}`;
			}
			const geocodeData = await geocodeResponse.json();
			if (!geocodeData.results || geocodeData.results.length === 0) {
				return `Error: Could not find location: ${location}`;
			}
			const { latitude, longitude } = geocodeData.results[0];

			// 2. Get weather for the location
			const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;
			const weatherResponse = await fetch(weatherUrl);
			if (!weatherResponse.ok) {
				return `Error: Unable to fetch weather. API status: ${weatherResponse.status}`;
			}
			const weatherData = await weatherResponse.json();
			const temp = weatherData.current.temperature_2m;
			const unit = weatherData.current_units.temperature_2m;

			return `The current temperature in ${location} is ${temp}${unit}.`;
		} catch (error) {
			console.error('Weather tool error:', error);
			return 'Error: Failed to get weather information.';
		}
	},
});

export const tools = [weatherTool];
