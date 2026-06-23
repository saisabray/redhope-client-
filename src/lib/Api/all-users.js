import { authClient } from "../auth-client";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const getAllUsers = async () => {
  const { data: token } = await authClient.token()  
  try {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token?.token}`
       },
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
};

export const updateUserStatus = async (id, status) => {
  const { data: token } = await authClient.token()

  try {
    const res = await fetch(`${BASE_URL}/users/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token?.token}`
       },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update user status");
    return await res.json();
  } catch (error) {
    console.error("Failed to update user status:", error);
    throw error;
  }
};

export const updateUserRole = async (id, role) => {
  const { data: token } = await authClient.token();
  try {
    const res = await fetch(`${BASE_URL}/users/${id}/role`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token?.token}`
      },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error("Failed to update user role");
    return await res.json();
  } catch (error) {
    console.error("Failed to update user role:", error);
    throw error;
  }
};

export const updateUserProfile = async (id, profileData) => {
  const { data: token } = await authClient.token();
  try {
    const res = await fetch(`${BASE_URL}/users/${id}/profile`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token?.token}`
      },
      body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return await res.json();
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw error;
  }
};
