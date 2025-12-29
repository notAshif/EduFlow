import { NextResponse } from 'next/server';
import { requireAuth, getGoogleOAuthToken } from '@/lib/auth';
import { google } from 'googleapis';

export async function GET(req: Request) {
    try {
        const user = await requireAuth();
        const googleToken = await getGoogleOAuthToken();
        const { searchParams } = new URL(req.url);
        const formId = searchParams.get('formId');

        if (!formId) {
            return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
        }

        if (!googleToken) {
            return NextResponse.json({ error: 'Google integration is required' }, { status: 401 });
        }

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: googleToken });

        const forms = google.forms({ version: 'v1', auth });

        // Get form responses
        const response = await forms.forms.responses.list({
            formId: formId,
            pageSize: 5,
        });

        // Get form details to map question IDs to titles
        const formDetails = await forms.forms.get({
            formId: formId,
        });

        const questions: Record<string, string> = {};
        formDetails.data.items?.forEach((item: any) => {
            if (item.questionItem?.question?.questionId) {
                questions[item.questionItem.question.questionId] = item.title || 'Untitled Question';
            }
        });

        return NextResponse.json({
            responses: response.data.responses || [],
            questions: questions,
            formTitle: formDetails.data.info?.title || 'Untitled Form'
        });
    } catch (error: any) {
        console.error('[Google Forms Responses API] Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch form responses',
            details: error.response?.data || null
        }, { status: error.status || 500 });
    }
}
