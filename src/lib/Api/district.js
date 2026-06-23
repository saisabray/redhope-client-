import districtsData from "../../../public/data/districts.json";
import upazilasData from "../../../public/data/upazilas.json";

export async function getDistricts() {
  return districtsData;
}

export async function getUpazilas() {
  return upazilasData;
}
