"use server";

import { AuthError } from "next-auth";
import { signIn } from "../../auth";

export default async function googleLogin() {
  try {
    await signIn("google", {
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
