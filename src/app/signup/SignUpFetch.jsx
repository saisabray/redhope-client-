import { getDistricts } from "@/lib/Api/district";
import SignUpPage from "./page";

export const Location = async () => {
    const data = await getDistricts();
    return <SignUpPage data={data} />

}