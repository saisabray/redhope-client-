const key = process.env.NEXT_PUBLIC_IMAGEBB_API_KEY
export const imageUpload = async (image) => {
  const formData = new FormData();
  formData.append("image", image);

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${key}`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await res.json();
  // console.log(data)
  return data.data;
};
