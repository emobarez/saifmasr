import { redirect } from "next/navigation";

export default function Page() {
  // This route has been deprecated; redirect to the main admin list
  redirect("/admin/service-requests");
}
