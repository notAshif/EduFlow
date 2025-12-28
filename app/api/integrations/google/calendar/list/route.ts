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

        // Fetch calendar list from Google Calendar API
        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: errorData.error?.message || "Failed to fetch calendars" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({
            calendars: data.items || [],
        });
    } catch (error: any) {
        console.error("[API:google-calendar-list] Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
