// src/app/teacher/review/[id]/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import TeacherReviewClient from "./TeacherReviewClient";

export default async function TeacherReviewPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const userRole = (session.user as any).role;

  // Protect route
  if (userRole !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch student submission
  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      student: {
        select: { name: true, email: true },
      },
    },
  });

  if (!submission) {
    redirect("/teacher");
  }

  // Serialize properties safely
  const serializedSubmission = {
    ...submission,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
  };

  return <TeacherReviewClient submission={serializedSubmission} />;
}
