// src/app/dashboard/report/[id]/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ReportViewClient from "./ReportViewClient";

export default async function ReportPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Fetch the submission details from Prisma
  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      student: {
        select: { name: true, email: true },
      },
    },
  });

  if (!submission) {
    redirect("/dashboard");
  }

  // Verify that the student owns the submission, or the user is a teacher
  if (userRole !== "TEACHER" && submission.studentId !== userId) {
    redirect("/dashboard");
  }

  // Serialize Prisma DateTime/JSON properties safely for Next.js server-client transition
  const serializedSubmission = {
    ...submission,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
  };

  return <ReportViewClient submission={serializedSubmission} />;
}
