export const authFetch = async (url: string, options: RequestInit = {}) => {
    let token = null;
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

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Optional: Redirect to login or handle session expiration
        console.error('Unauthorized access - redirecting to login?');
        // window.location.href = '/login'; // Uncomment if you want auto-redirect
    }

    return response;
};
