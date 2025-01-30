"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import credentialsSignin from "@/server-actions/credentialsLogin";
import googleLogin from "@/server-actions/googleLogin";

interface FormInputs {
  email: string;
  password: string;
}

const SignInPage: React.FC = () => {
  const form = useForm<FormInputs>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormInputs) => {
    try {
      await credentialsSignin(data.email, data.password);
    } catch (error) {
      console.error("error while credential signin", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
    } catch (error) {
      console.error("error while google login", error);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/90">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />

      <Card className="w-full max-w-6xl relative overflow-hidden shadow-2xl border-none">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Form */}
          <div className="w-full md:w-1/2 p-8 bg-white">
            <div className="h-full flex flex-col justify-center max-w-md mx-auto">
              <div className="mb-12">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                  Welcome back
                </h1>
                <p className="text-zinc-500">
                  Please sign in to your account to continue
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@example.com"
                            className="h-12 px-4 border-zinc-200 focus:ring-2 focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            className="h-12 px-4 border-zinc-200 focus:ring-2 focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all"
                  >
                    Sign in
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-zinc-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-zinc-500">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    className="w-full h-12 flex items-center justify-center space-x-2 border-zinc-200 hover:bg-zinc-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Right side - Gradient Design */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-primary via-primary/80 to-secondary relative overflow-hidden min-h-[400px] md:min-h-full">
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Large glowing orb */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/30 rounded-full blur-3xl" />

                {/* Floating circles */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-xl animate-float" />
                <div className="absolute bottom-8 right-8 w-24 h-24 bg-white/20 rounded-full blur-xl animate-float-delay" />
                <div className="absolute top-8 right-0 w-40 h-40 bg-white/20 rounded-full blur-xl animate-float" />

                {/* Content overlay */}
                <div className="relative z-10 text-white text-center p-8">
                  <h2 className="text-3xl font-bold mb-4">
                    Welcome to Our Platform
                  </h2>
                  <p className="text-lg text-white/90">
                    Discover amazing features and possibilities
                  </p>
                </div>
              </div>
            </div>

            {/* Mesh gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </Card>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float 6s ease-in-out infinite;
          animation-delay: 2s;
        }
        .bg-grid-white {
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            );
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};

export default SignInPage;
