import { getDistricts, getUpazilas } from "@/lib/Api/district";
import SignUpForm from "./SignUpForm";

const SignUpPage = async () => {
  const districtsRaw = await getDistricts();
  const upazilasRaw = await getUpazilas();

  const districts =
    districtsRaw.find((item) => item.type === "table")?.data || [];
  const upazilas =
    upazilasRaw.find((item) => item.type === "table")?.data || [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-screen sm:w-[500px]">
        <SignUpForm districts={districts} upazilas={upazilas} />
      </div>
    </div>
  );
};

export default SignUpPage;
