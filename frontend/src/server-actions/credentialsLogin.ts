"use server";

import { AuthError } from "next-auth";
import { signIn } from "../../auth";

export default async function credentialsSignin(
  email: string,
  password: string
) {
  try {
    await signIn("credentials", {
      username: email,
      password: password,
      redirect: true,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Parse the error message from the credentials provider
      throw new Error(error?.cause?.err?.message);
    }
    throw error;
  }
}
