// src/app/api/submissions/[id]/evaluate/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { evaluateEssay } from "@/lib/openai";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const { id } = params;

    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Only the student owner or a teacher can evaluate the essay
    if (userRole !== "TEACHER" && submission.studentId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Call OpenAI evaluation
    const evaluation = await evaluateEssay(
      submission.prompt,
      submission.essayText,
      submission.taskType
    );

    // Save evaluation results and change status to PENDING_REVIEW if it was a draft
    const updated = await prisma.submission.update({
      where: { id },
      data: {
        aiScoreOverall: evaluation.scores.overall,
        aiScoreTF: evaluation.scores.taskFulfillment,
        aiScoreOrg: evaluation.scores.organization,
        aiScoreVoc: evaluation.scores.vocabulary,
        aiScoreGra: evaluation.scores.grammar,
        aiFeedbackRaw: evaluation.taggedEssay,
        aiFeedbackJson: evaluation.feedback as any,
        status: submission.status === "DRAFT" ? "PENDING_REVIEW" : submission.status,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("AI Evaluation API error:", error);
    return NextResponse.json({ error: "Evaluation failed: " + error.message }, { status: 500 });
  }
}
