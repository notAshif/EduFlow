import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const accessToken = await getGoogleOAuthToken();
        if (!accessToken) {
            return NextResponse.json(
                { error: "Google integration required. Please connect your Google account." },
                { status: 401 }
            );
        }

        // Fetch courses from Google Classroom API
        const response = await fetch(
            "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=100",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        if (!response.ok) {
            let errorMessage = "Failed to fetch classroom data";
            if (isJson) {
                const errorData = await response.json();
                errorMessage = errorData.error?.message || errorMessage;
            } else {
                const textError = await response.text();
                console.warn("[API:google-classroom-metadata] Non-JSON error:", textError.substring(0, 200));
            }

            return NextResponse.json(
                { error: errorMessage },
                { status: response.status }
            );
        }

        if (!isJson) {
            return NextResponse.json(
                { error: "Google API returned an unexpected response format." },
                { status: 502 }
            );
        }

        const data = await response.json();
        const courses = data.courses?.map((course: any) => ({
            id: course.id,
            name: course.name,
            section: course.section,
            alternateLink: course.alternateLink
        })) || [];

        return NextResponse.json({
            courses,
        });
    } catch (error: any) {
        console.error("[API:google-classroom-metadata] Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
