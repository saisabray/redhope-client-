"use server"
const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export const funding = async (data) => {
    const response = await fetch(`${baseUrl}/funding`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

export const getAllFunding = async () => {
    const response = await fetch(`${baseUrl}/funding`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        cache: 'no-store' 
    });
    return response.json();
}

export default funding;
