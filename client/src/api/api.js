const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const apiRequest = async (endpoint, method = 'GET', body = null) => {
    const options = {
        method,
        headers: {
            ...getAuthHeaders(),
        },
    };

    if (body) {
        if (body instanceof FormData) {
            // Let the browser set the Content-Type for FormData
        } else {
            options.headers['Content-Type'] = 'application/json';
        }
        options.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (response.status === 401) {
        // Handle unauthorized access, e.g., by forcing logout
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        window.location.href = '/login'; 
        throw new Error('Session expired. Please log in again.');
    }
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    // For DELETE requests or others that might not have a body
    if (response.status === 204) {
        return;
    }
    
    return response.json();
};

export default apiRequest; 