"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Button,
  Card,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Select,
  TextField,
  ListBox,
} from "@heroui/react";

import Image from "next/image";
import Link from "next/link";
import { Check } from "@gravity-ui/icons";

import { imageUpload } from "@/lib/imageupload";
import { authClient } from "@/lib/auth-client";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function SignUpForm({ districts = [], upazilas = [] }) {
  const router = useRouter();

  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [filteredUpazilas, setFilteredUpazilas] = useState([]);
  const [blood, setBlood] = useState("");
  const [upazila, setUpazila] = useState("");

  const inputClass =
    "bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-red-500";

  const selectClass = "bg-slate-950 border border-slate-800 text-slate-100";

  // ✅ District change
  const handleDistrictChange = (value) => {
    const districtName = Array.isArray(value) ? [...value][0] : value;

    setSelectedDistrict(districtName);
    setUpazila("");

    const district = districts.find((d) => d.name === districtName);

    const filtered = upazilas.filter(
      (u) => String(u.district_id) === String(district?.id),
    );

    setFilteredUpazilas(filtered);
  };

  // ✅ Submit form
  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.target);
      const imageFile = formData.get("image");

      const image = await imageUpload(imageFile);

      const userData = {
        name: formData.get("name"),
        image: image.url,
        bloodGroup: blood,
        district: selectedDistrict,
        upazila: upazila,
        email: formData.get("email"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
        role: "donor",
        status: "active",
      };

      if (userData.password !== userData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      const { error } = await authClient.signUp.email(userData);

      if (error) {
        alert("Signup failed");
        return;
      }

      e.target.reset();
      setBlood("");
      setSelectedDistrict("");
      setUpazila("");
      setFilteredUpazilas([]);

      router.push("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="mx-auto w-full sm:w-[420px] py-10 mt-10 bg-slate-800 text-white">
      {/* Logo */}
      <Image
        src="/images/logo-auth.png"
        alt="Logo"
        width={200}
        height={80}
        className="mx-auto"
      />

      <h1 className="text-center text-2xl font-semibold text-slate-300 mb-6">
        Sign Up
      </h1>

      <Form className="flex flex-col gap-4 px-6" onSubmit={onSubmit}>
        {/* NAME */}
        <TextField isRequired name="name">
          <Label className="text-slate-300">Full Name</Label>
          <Input className={inputClass} placeholder="John Doe" />
          <FieldError />
        </TextField>

        {/* IMAGE */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300">Profile Image</Label>
          <input
            name="image"
            type="file"
            accept="image/*"
            className={inputClass}
          />
        </div>

        {/* BLOOD GROUP */}
        <Select onChange={(v) => setBlood(Array.from(v)[0])}>
          <Label className="text-slate-300">Blood Group</Label>
          <Select.Trigger className={selectClass}>
            <Select.Value placeholder="Select blood group" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {bloodGroups.map((b) => (
                <ListBox.Item key={b} id={b}>
                  {b}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {/* DISTRICT */}
        <Select onChange={handleDistrictChange}>
          <Label className="text-slate-300">District</Label>
          <Select.Trigger className={selectClass}>
            <Select.Value placeholder="Select district" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {districts.map((d) => (
                <ListBox.Item key={d.id} id={d.name}>
                  {d.name}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {/* UPAZILA */}
        <Select
          onChange={(v) => setUpazila(Array.from(v)[0])}
          isDisabled={!selectedDistrict}
        >
          <Label className="text-slate-300">Upazila</Label>
          <Select.Trigger className={selectClass}>
            <Select.Value placeholder="Select upazila" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {filteredUpazilas.map((u) => (
                <ListBox.Item key={u.id} id={u.name}>
                  {u.name}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {/* EMAIL */}
        <TextField isRequired name="email" type="email">
          <Label className="text-slate-300">Email</Label>
          <Input className={inputClass} placeholder="john@example.com" />
          <FieldError />
        </TextField>

        {/* PASSWORD */}
        <TextField isRequired name="password" type="password">
          <Label className="text-slate-300">Password</Label>
          <Input className={inputClass} placeholder="Enter password" />
          <Description>Min 6 characters</Description>
        </TextField>

        {/* CONFIRM PASSWORD */}
        <TextField isRequired name="confirmPassword" type="password">
          <Label className="text-slate-300">Confirm Password</Label>
          <Input className={inputClass} placeholder="Confirm password" />
        </TextField>

        {/* BUTTONS */}
        <div className="flex gap-2">
          <Button type="submit" color="danger">
            <Check />
            Submit
          </Button>

          <Button type="reset" variant="bordered">
            Reset
          </Button>
        </div>
      </Form>

      {/* LOGIN LINK */}
      <div className="text-center mt-4 text-sm text-slate-300">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-500 hover:underline">
          Log in
        </Link>
      </div>
    </Card>
  );
}
