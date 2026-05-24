import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { PreferenceSettings } from "@/components/PreferenceSettings";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { isCategory, type Category } from "@/lib/categoryTypes";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const preferredCategories = user.preferredCategories.filter(isCategory) as Category[];

  return (
    <Container className="py-8 sm:py-10">
      <PreferenceSettings initialCategories={preferredCategories} />
    </Container>
  );
}
