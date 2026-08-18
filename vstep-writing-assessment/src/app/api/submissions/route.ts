// src/app/api/submissions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    let submissions;
    if (userRole === "TEACHER") {
      // Teachers see all non-draft submissions
      submissions = await prisma.submission.findMany({
        where: {
          status: { in: ["PENDING_REVIEW", "REVIEWED"] },
        },
        include: {
          student: {
            select: { name: true, email: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    } else {
      // Students see all of their own submissions (drafts and finalized)
      submissions = await prisma.submission.findMany({
        where: { studentId: userId },
        orderBy: { updatedAt: "desc" },
      });
    }

    return NextResponse.json(submissions);
  } catch (error: any) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = (session.user as any).id;
    const { id, taskType, prompt, essayText, wordCount, status } = await req.json();

    if (!prompt || !essayText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let submission;
    if (id) {
      // Update existing submission
      const existing = await prisma.submission.findUnique({ where: { id } });
      if (!existing || existing.studentId !== userId) {
        return NextResponse.json({ error: "Submission not found or unauthorized" }, { status: 404 });
      }

      submission = await prisma.submission.update({
        where: { id },
        data: {
          essayText,
          wordCount,
          status: status || existing.status,
        },
      });
    } else {
      // Create new submission
      submission = await prisma.submission.create({
        data: {
          studentId: userId,
          taskType: taskType || "TASK2",
          prompt,
          essayText,
          wordCount,
          status: status || "DRAFT",
        },
      });
    }

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error("Save submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
