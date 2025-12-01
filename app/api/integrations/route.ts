/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const Json: z.ZodType<any> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.lazy(() => z.array(Json)),
  z.lazy(() => z.record(z.string(), Json)),
]);

const createIntegrationSchema = z.object({
  type: z.string(),
  credentials: Json,
  meta: Json.optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const integrations = await prisma.integrationConnection.findMany({
      where: {
        organizationId: user.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      data: integrations,
    });
  } catch (error) {
    console.error("Error fetching integrations:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { type, credentials, meta } = createIntegrationSchema.parse(body);

    const existing = await prisma.integrationConnection.findFirst({
      where: {
        organizationId: user.organizationId,
        type,
      },
    });

    let integration;
    if (existing) {
      integration = await prisma.integrationConnection.update({
        where: { id: existing.id },
        data: {
          credentials: credentials as unknown as Prisma.InputJsonValue,
          meta: meta as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      integration = await prisma.integrationConnection.create({
        data: {
          type,
          credentials: credentials as unknown as Prisma.InputJsonValue,
          meta: meta as unknown as Prisma.InputJsonValue,
          organizationId: user.organizationId,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      data: integration,
    });
  } catch (error) {
    console.error("Error creating integration:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}