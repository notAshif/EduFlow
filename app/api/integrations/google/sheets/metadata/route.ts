import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthToken } from "@/lib/auth";

/**
 * Extract Spreadsheet ID from a potentially full URL
 */
function extractSpreadsheetId(idOrUrl: string): string {
    if (!idOrUrl) return '';
    const urlMatch = idOrUrl.match(/[-\w]{25,}/);
    return urlMatch ? urlMatch[0] : idOrUrl;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let spreadsheetId = searchParams.get("spreadsheetId");

        if (!spreadsheetId) {
            return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 });
        }

        spreadsheetId = extractSpreadsheetId(spreadsheetId);

        const accessToken = await getGoogleOAuthToken();
        if (!accessToken) {
            return NextResponse.json(
                { error: "Google integration required. Please connect your Google account." },
                { status: 401 }
            );
        }

        // 1. Try fetching from Sheets API
        const sheetsRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title,properties.title`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const contentType = sheetsRes.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        if (sheetsRes.ok && isJson) {
            const data = await sheetsRes.json();
            return NextResponse.json({
                spreadsheetName: data.properties?.title || "Untitled Spreadsheet",
                sheetNames: data.sheets?.map((s: any) => s.properties.title) || [],
                spreadsheetId
            });
        }

        // 2. If Sheets API 404s, check Drive API to see if it's a different file type
        if (sheetsRes.status === 404) {
            console.log(`[API:google-sheets-metadata] Sheets API 404 for ${spreadsheetId}. Checking Drive API...`);
            const driveRes = await fetch(
                `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=id,name,mimeType&supportsAllDrives=true`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (driveRes.ok) {
                const driveData = await driveRes.json();
                const mimeType = driveData.mimeType;

                if (mimeType === 'text/csv' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                    return NextResponse.json({
                        error: `File "${driveData.name}" found, but it's a ${mimeType === 'text/csv' ? 'CSV' : 'Excel'} file. Please open it in Google Sheets once to convert it, or use a native Google Sheet.`,
                        spreadsheetId
                    }, { status: 404 });
                }

                return NextResponse.json({
                    error: `File found in Drive, but it's not a spreadsheet (Type: ${mimeType}).`,
                    spreadsheetId
                }, { status: 404 });
            }
        }

        // 3. Fallback to generic error
        let errorMessage = "Spreadsheet not found. Please check the ID or URL.";
        if (isJson) {
            const errorData = await sheetsRes.json();
            errorMessage = errorData.error?.message || errorMessage;
        }

        return NextResponse.json({ error: errorMessage, spreadsheetId }, { status: sheetsRes.status });

    } catch (error: any) {
        console.error("[API:google-sheets-metadata] Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
