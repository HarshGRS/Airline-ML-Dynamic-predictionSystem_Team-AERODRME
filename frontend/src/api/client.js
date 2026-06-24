import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    timeout: 10000,
});

export const FLIGHT_OPTIONS = {
    airlines: [
        { value: 'AirAsia', label: 'AirAsia' },
        { value: 'Air_India', label: 'Air India' },
        { value: 'GO_FIRST', label: 'GO FIRST' },
        { value: 'Indigo', label: 'IndiGo' },
        { value: 'SpiceJet', label: 'SpiceJet' },
        { value: 'Vistara', label: 'Vistara' },
    ],
    cities: [
        { value: 'Bangalore', label: 'Bangalore' },
        { value: 'Chennai', label: 'Chennai' },
        { value: 'Delhi', label: 'Delhi' },
        { value: 'Hyderabad', label: 'Hyderabad' },
        { value: 'Kolkata', label: 'Kolkata' },
        { value: 'Mumbai', label: 'Mumbai' },
    ],
    timesOfDay: [
        { value: 'Early_Morning', label: 'Early Morning' },
        { value: 'Morning', label: 'Morning' },
        { value: 'Afternoon', label: 'Afternoon' },
        { value: 'Evening', label: 'Evening' },
        { value: 'Night', label: 'Night' },
        { value: 'Late_Night', label: 'Late Night' },
    ],
    stops: [
        { value: 'zero', label: 'Non-stop' },
        { value: 'one', label: '1 Stop' },
        { value: 'two_or_more', label: '2+ Stops' },
    ],
    classes: [
        { value: 'Economy', label: 'Economy' },
        { value: 'Business', label: 'Business' },
    ],
};

export async function predictPrice(payload) {
    const response = await apiClient.post('/predict', payload);
    return response.data;
}

export async function getModelInfo() {
    const response = await apiClient.get('/model/info');
    return response.data;
}
