"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const LoginPage = () => {
  const router = useRouter();
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    const { data, error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message || "Invalid email or password");
      return;
    }

    router.push("/");
    router.refresh();
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 ">
      <Card className="shadow-md mx-auto w-screen sm:w-125 py-10 mt-10 bg-slate-800 text-white">
        <Image
          src="/images/logo-auth.png"
          alt="Logo"
          width={250}
          height={100}
          className="mx-auto"
        />
        <h1 className="text-center text-2xl text-slate-300 font-semibold mb-4">
          Log In
        </h1>
        {error && (
          <p className="text-red-400 text-center text-sm mb-2">{error}</p>
        )}
        <Form className="flex w-96 mx-auto flex-col gap-4" onSubmit={onSubmit}>
          <TextField
            name="email"
            type="email"
            validate={(value) => {
              if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                return "Please enter a valid email address";
              }
              return null;
            }}
          >
            <Label className="text-slate-300">Email</Label>
            <Input
              placeholder="john@example.com"
              className="bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-red-500"
            />
            <FieldError />
          </TextField>

          <TextField
            isRequired
            name="password"
            type="password"
          >
            <Label className="text-slate-300">Password</Label>
            <Input
              placeholder="Enter your password"
              className="bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-red-500"
            />
            <FieldError />
          </TextField>

          <div className="flex gap-2">
            <Button type="submit" variant="primary">
              Submit
            </Button>

            <Button type="reset" variant="danger-soft">
              Reset
            </Button>
          </div>
        </Form>

        <div className="text-center mt-4 text-sm text-slate-300 pb-4">
          Don&apos;t have an account?
          <Link href="/signup" className="text-blue-500 hover:underline">
            Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
