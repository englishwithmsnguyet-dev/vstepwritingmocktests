// src/app/api/submissions/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const { id } = params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        student: {
          select: { name: true, email: true },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Students can only view their own submissions
    if (userRole !== "TEACHER" && submission.studentId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error("Fetch submission by ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
