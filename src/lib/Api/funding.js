"use server"
import { headers } from "next/headers";
import { authClient } from "../auth-client";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export const funding = async (data) => {
    const { data: token } = await authClient.token({
        fetchOptions: {
            headers: await headers()
        }
    });
    const response = await fetch(`${baseUrl}/funding`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token?.token}`
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

export const getAllFunding = async () => {
    const { data: token } = await authClient.token({
        fetchOptions: {
            headers: await headers()
        }
    });
    const response = await fetch(`${baseUrl}/funding`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token?.token}`
        },
        cache: 'no-store' 
    });
    return response.json();
}

export default funding;
