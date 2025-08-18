import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const weatherTool = new DynamicStructuredTool({
	name: 'get_weather',
	description:
		"Get the current weather for a specified location. If no location is provided, uses the user's current location.",
	schema: z.object({
		location: z
			.string()
			.optional()
			.describe(
				"The city and state, e.g., San Francisco, CA. If not provided, uses user's current location.",
			),
	}),
	func: async ({ location }) => {
		try {
			let latitude: number;
			let longitude: number;
			let locationName: string;
			let country: string;
			let countryCode: string;

			if (!location) {
				// Get user's location using IP geolocation
				try {
					const ipResponse = await fetch('https://ipapi.co/json/');
					if (!ipResponse.ok) {
						return 'Error: Unable to determine your location. Please provide a specific location.';
					}
					const ipData = await ipResponse.json();
					latitude = ipData.latitude;
					longitude = ipData.longitude;
					locationName = ipData.city;
					country = ipData.country_name;
					countryCode = ipData.country_code;
				} catch (error) {
					return 'Error: Unable to determine your location. Please provide a specific location.';
				}
			} else {
				// Geocode the provided location
				const locationVariations = [
					location,
					location.split(',')[0].trim(), // Just the city name
				];

				let geocodeData = null;

				for (const locationVariation of locationVariations) {
					const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
						locationVariation,
					)}&count=1`;

					const geocodeResponse = await fetch(geocodeUrl);
					if (!geocodeResponse.ok) {
						continue; // Try next variation
					}
					const data = await geocodeResponse.json();

					if (data.results && data.results.length > 0) {
						geocodeData = data;
						break;
					}
				}

				if (
					!geocodeData ||
					!geocodeData.results ||
					geocodeData.results.length === 0
				) {
					return `Error: Could not find location: ${location}. Please try a different format like "San Francisco" or "London".`;
				}

				latitude = geocodeData.results[0].latitude;
				longitude = geocodeData.results[0].longitude;
				locationName = geocodeData.results[0].name;
				country = geocodeData.results[0].country;
				countryCode = geocodeData.results[0].country_code;
			}

			// Determine temperature unit based on country
			const useFahrenheit = ['US', 'LR', 'MM'].includes(countryCode); // US, Liberia, Myanmar
			const tempUnit = useFahrenheit ? 'fahrenheit' : 'celsius';

			// 2. Get weather for the location
			const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=${tempUnit}`;
			const weatherResponse = await fetch(weatherUrl);
			if (!weatherResponse.ok) {
				return `Error: Unable to fetch weather. API status: ${weatherResponse.status}`;
			}
			const weatherData = await weatherResponse.json();
			const temp = weatherData.current.temperature_2m;
			const unit = weatherData.current_units.temperature_2m;

			return `${temp}${unit} in ${locationName}, ${country}`;
		} catch (error) {
			console.error('Weather tool error:', error);
			return 'Error: Failed to get weather information.';
		}
	},
});

export const tools = [weatherTool];
