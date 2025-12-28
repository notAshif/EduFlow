import { getGoogleOAuthToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const calendarId = searchParams.get("calendarId") || "primary";

        const accessToken = await getGoogleOAuthToken();
        if (!accessToken) {
            return NextResponse.json(
                { error: "Google integration required. Please connect your Google account." },
                { status: 401 }
            );
        }

        const now = new Date();
        const timeMin = now.toISOString();

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=20&singleEvents=true&orderBy=startTime`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("[API:google-calendar-events] API error:", errorData);
            return NextResponse.json(
                { error: errorData.error?.message || "Failed to fetch events" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({
            events: data.items || [],
        });
    } catch (error: any) {
        console.error("[API:google-calendar-events] Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
