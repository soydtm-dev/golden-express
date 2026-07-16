import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import UsersManagementClient from "@/components/users-management-client";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // 1. Obtener la sesión de usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Consultar si el usuario autenticado tiene rol de administrador en la tabla couriers
  const { data: courier, error } = await supabase
    .from("couriers")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  // Redirigir al dashboard general si no existe o no tiene permisos de administrador
  if (error || !courier || !courier.is_admin) {
    redirect("/dashboard");
  }

  // 3. Obtener todos los repartidores y administradores registrados
  const { data: allCouriers } = await supabase
    .from("couriers")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col overflow-hidden">
      <UsersManagementClient initialCouriers={allCouriers || []} />
    </div>
  );
}
