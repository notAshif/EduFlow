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

        // Fetch Google Forms from Drive API
        const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.form' and trashed = false");
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=50&fields=files(id, name, webViewLink, iconLink, modifiedTime)`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: errorData.error?.message || "Failed to fetch forms from Google Drive" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({
            forms: data.files || [],
        });
    } catch (error: any) {
        console.error("[API:google-forms-list] Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
