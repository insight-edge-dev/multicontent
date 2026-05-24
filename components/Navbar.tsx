import { PremiumNavbar } from "@/components/PremiumNavbar";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <PremiumNavbar
      user={user ? { name: user.name, email: user.email } : null}
    />
  );
}
