import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/",
      });
    } catch (e) {
      if ((e as Error).message === "NEXT_REDIRECT") throw e;
      redirect("/login?error=1");
    }
  }
  return (
    <main className="mx-auto mt-24 max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Stock PP — Login</h1>
      <form action={login} className="space-y-3">
        <input name="email" type="email" placeholder="Email" required className="w-full border p-2 rounded" />
        <input name="password" type="password" placeholder="Password" required className="w-full border p-2 rounded" />
        <button className="w-full bg-black text-white p-2 rounded">Masuk</button>
      </form>
    </main>
  );
}
