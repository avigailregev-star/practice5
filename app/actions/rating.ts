"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updateSelfRating(sessionId: string, rating: 1 | 2 | 3): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("practice_sessions")
    .update({ self_rating: rating } as never)
    .eq("id", sessionId)
    .eq("student_id", user.id); // safety: only update own session
}
