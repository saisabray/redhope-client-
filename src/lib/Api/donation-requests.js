import { authClient } from "../auth-client";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Create a new donation request
export const createDonationRequest = async (payload) => {
  const { data: token } = await authClient.token()
  try {
    const res = await fetch(`${BASE_URL}/donation-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token?.token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || "Failed to create donation request.");
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to create donation request:", error);
    throw error;
  }
};

// Get all donation requests
export const getAllDonationRequests = async () => {
  try {
    const res = await fetch(`${BASE_URL}/donation-requests`);
    if (!res.ok) throw new Error("Failed to fetch donation requests.");
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch donation requests:", error);
    throw error;
  }
};

// Get donation requests by requester email
export const getMyDonationRequests = async (email) => {
  const { data: token } = await authClient.token();
  try {
    const res = await fetch(`${BASE_URL}/donation-requests/my/${encodeURIComponent(email)}`, {
      headers: { "Authorization": `Bearer ${token?.token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch your donation requests.");
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch user donation requests:", error);
    throw error;
  }
};

// Get single donation request by ID
export const getDonationRequestById = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/donation-requests/${id}`);
    if (!res.ok) throw new Error("Failed to fetch donation request.");
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch donation request:", error);
    throw error;
  }
};

// Update donation request status
export const updateDonationRequestStatus = async (id, status) => {
  const { data: token } = await authClient.token();
  try {
    const res = await fetch(`${BASE_URL}/donation-requests/${id}/status`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token?.token}`
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update donation request status.");
    return await res.json();
  } catch (error) {
    console.error("Failed to update donation request status:", error);
    throw error;
  }
};

// Delete a donation request
export const deleteDonationRequest = async (id) => {
  const { data: token } = await authClient.token();
  try {
    const res = await fetch(`${BASE_URL}/donation-requests/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token?.token}` }
    });
    if (!res.ok) throw new Error("Failed to delete donation request.");
    return await res.json();
  } catch (error) {
    console.error("Failed to delete donation request:", error);
    throw error;
  }
};
