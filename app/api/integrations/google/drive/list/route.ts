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

        // Fetch files from Google Drive API, ordered by modified time
        // We broadly list folders and files to help the user navigate or pick
        const query = encodeURIComponent("trashed = false");
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=100&fields=files(id, name, mimeType, webViewLink, iconLink, modifiedTime)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: errorData.error?.message || "Failed to fetch files from Google Drive" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({
            files: data.files || [],
        });
    } catch (error: any) {
        console.error("[API:google-drive-list] Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
