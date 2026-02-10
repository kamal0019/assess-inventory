const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const authFetch = async (url: string, options: RequestInit = {}) => {
    let token = null;

    // Construct full URL if it's a relative path
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

    if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                token = user.token;
            } catch (e) {
                console.error("Error parsing user from local storage", e);
            }
        }
    }

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Optional: Redirect to login or handle session expiration
            console.error('Unauthorized access - redirecting to login?');
            // window.location.href = '/login'; // Uncomment if you want auto-redirect
        }

        return response;
    } catch (error) {
        console.error('Network Error:', error);
        throw error;
    }
};


