export async function getDistricts() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/data/districts.json`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch districts");
  }

  return res.json();
}

export async function getUpazilas() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/data/upazilas.json`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch upazilas");
  }

  return res.json();
}
