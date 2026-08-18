// src/app/api/teacher/comments/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized. Teacher role required." }, { status: 401 });
  }

  try {
    const teacherId = (session.user as any).id;
    const {
      submissionId,
      scoreOverall,
      scoreTF,
      scoreOrg,
      scoreVoc,
      scoreGra,
      comments,
    } = await req.json();

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submission ID" }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        teacherId,
        teacherScoreOverall: scoreOverall !== undefined ? parseFloat(scoreOverall) : null,
        teacherScoreTF: scoreTF !== undefined ? parseFloat(scoreTF) : null,
        teacherScoreOrg: scoreOrg !== undefined ? parseFloat(scoreOrg) : null,
        teacherScoreVoc: scoreVoc !== undefined ? parseFloat(scoreVoc) : null,
        teacherScoreGra: scoreGra !== undefined ? parseFloat(scoreGra) : null,
        teacherComments: comments || null,
        status: "REVIEWED",
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Save teacher review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
