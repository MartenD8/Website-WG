import { Box, Container } from "@mui/material";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getSession } from "@/lib/auth";
import { getAllEvents } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const events = getAllEvents();

  return (
    <Box sx={{ minHeight: "100vh", pb: 6 }}>
      <SiteHeader showAdminLink={false} title="Event Kalender · Admin" />
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 } }}>
        <AdminDashboard initialEvents={events} username={session.username} />
      </Container>
    </Box>
  );
}
