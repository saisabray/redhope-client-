const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const getAllUsers = async () => {
  try {
    const res = await fetch(`${BASE_URL}/users`);
    if (!res.ok) throw new Error("Failed to fetch users");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
};

export const updateUserStatus = async (id, status) => {
  try {
    const res = await fetch(`${BASE_URL}/users/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
  try {
    const res = await fetch(`${BASE_URL}/users/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error("Failed to update user role");
    return await res.json();
  } catch (error) {
    console.error("Failed to update user role:", error);
    throw error;
  }
};
