import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useNavigate, Link } from "@tanstack/react-router";
import { Spinner } from "../ui/spinner";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name required"),
    email: z.email("Invalid email"),
    password: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function SignupForm({ className, ...props }: React.ComponentProps<typeof Card>) {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    validators: { onSubmit: signupSchema },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.signUp.email({
        email: value.email,
        password: value.password!,
        name: value.name,
      });
      if (error) return toast.error(error.message);
      toast.success("Account created!");
      navigate({ to: "/" });
    },
  });

  return (
    <Card className={cn("w-full border-primary", className)} {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your information below to create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup className="flex flex-col gap-6">
            <form.Field
              name="name"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    className="border-primary"
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            />

            <form.Field
              name="email"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    className="border-primary"
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldDescription>
                    We'll use this to contact you. We will not share your email with anyone else.
                  </FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            />

            <form.Field
              name="password"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    className="border-primary"
                    id="password"
                    type="password"
                    required
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldDescription>Must be at least 8 characters long.</FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            />

            <form.Field
              name="confirmPassword"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                  <Input
                    className="border-primary"
                    id="confirm-password"
                    type="password"
                    required
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldDescription>Please confirm your password.</FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            />

            <Field>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting && <Spinner className="mr-2 size-4" />}
                    {isSubmitting ? "Creating account…" : "Create Account"}
                  </Button>
                )}
              />

              <FieldSeparator className="mt-2">Or continue with</FieldSeparator>

              <Button
                variant="outline"
                type="button"
                className="w-full mt-2"
                onClick={() => authClient.signIn.social({ provider: "github" as any })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 size-4">
                  <path
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                    fill="currentColor"
                  />
                </svg>
                Sign up with GitHub
              </Button>

              <FieldDescription className="px-6 text-center">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="underline underline-offset-4 font-medium text-foreground"
                >
                  Sign in
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
