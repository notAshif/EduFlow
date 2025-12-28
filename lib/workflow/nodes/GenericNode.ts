/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';

/**
 * GenericNode - A production-ready node that fetches real-time data
 * Handles various node types with actual API integrations
 */
export class GenericNode extends BaseNode {
    private nodeType: string;
    private nodeLabel: string;
    private resultMessage: string;
    private resultData: Record<string, any>;

    constructor(
        config: Record<string, any>,
        nodeType: string,
        nodeLabel: string,
        resultMessage: string,
        resultData: Record<string, any> = {}
    ) {
        super(config);
        this.nodeType = nodeType;
        this.nodeLabel = nodeLabel;
        this.resultMessage = resultMessage;
        this.resultData = resultData;
    }

    validate(_config: Record<string, any>): void {
        // Validation based on node type
        switch (this.nodeType) {
            case 'google-classroom':
                // Requires OAuth token or API key
                break;
            case 'google-sheets':
                if (!_config.spreadsheetId) {
                    console.warn('[GenericNode:google-sheets] No spreadsheetId provided');
                }
                break;
            case 'google-calendar':
                break;
            case 'zoom-meeting':
                if (!_config.topic && !_config.meetingId) {
                    console.warn('[GenericNode:zoom-meeting] No topic or meetingId provided');
                }
                break;
            case 'ai-summarize':
                if (!_config.text && !_config.prompt) {
                    console.warn('[GenericNode:ai-summarize] No text or prompt provided');
                }
                break;
        }
    }

    async execute(context: NodeExecutionContext): Promise<any> {
        const { input, context: ctx, services } = context;
        const credentials = services?.credentials || {};

        console.log(`[GenericNode:${this.nodeType}] Executing ${this.nodeLabel}`);
        console.log(`[GenericNode:${this.nodeType}] Config:`, this.config);

        const startTime = Date.now();

        try {
            // Handle specific node types with real API calls
            switch (this.nodeType) {
                case 'trigger-schedule':
                    return this.executeTriggerSchedule(ctx);

                case 'trigger-webhook':
                    return this.executeTriggerWebhook(input);

                case 'google-classroom':
                    return await this.executeGoogleClassroom(credentials);

                case 'google-sheets':
                    return await this.executeGoogleSheets(credentials, input);

                case 'google-calendar':
                    return await this.executeGoogleCalendar(credentials);

                case 'zoom-meeting':
                    return await this.executeZoomMeeting(credentials);

                case 'google-drive':
                    return await this.executeGoogleDrive(credentials);

                case 'google-forms':
                    return await this.executeGoogleForms(credentials);

                case 'google-meet':
                    return await this.executeGoogleMeet(credentials);

                case 'grade-calculate':
                    return this.executeGradeCalculate(input);

                case 'ai-summarize':
                    return await this.executeAISummarize(credentials, input);

                case 'loop':
                    return this.executeLoop(input);

                case 'filter':
                    return this.executeFilter(input);

                case 'condition':
                    return this.executeCondition(input);

                case 'delay':
                    return await this.executeDelay();

                default:
                    return this.executeDefault(ctx, input, startTime);
            }
        } catch (error) {
            console.error(`[GenericNode:${this.nodeType}] Execution error:`, error);
            throw error;
        }
    }

    // ==================== GOOGLE DRIVE ====================

    private async executeGoogleDrive(credentials: Record<string, any>) {
        const accessToken = credentials?.accessToken || process.env.GOOGLE_ACCESS_TOKEN;
        const action = this.config.action || 'list-files';
        const folderId = this.config.folderId || 'root';

        if (!accessToken) {
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Google Drive access token required',
                timestamp: new Date().toISOString(),
                output: { error: 'No Google Drive credentials configured' }
            };
        }

        try {
            const baseUrl = 'https://www.googleapis.com/drive/v3';
            let endpoint = '';
            let method = 'GET';
            let body: string | undefined;

            // SMART FOLDER RESOLUTION: Handle "auto" or empty folderId
            let resolvedFolderId = folderId;
            if (!resolvedFolderId || resolvedFolderId === '' || resolvedFolderId === 'auto') {
                console.log('[GenericNode:google-drive] Auto-resolving folderId... Searching for "Classroom" folder first.');

                try {
                    // Try to find a folder named "Classroom" which is where Google Classroom stores stuff
                    const searchRes = await fetch(`${baseUrl}/files?q=name = 'Classroom' and mimeType = 'application/vnd.google-apps.folder' and trashed = false&fields=files(id, name)`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });

                    if (searchRes.ok) {
                        const searchData = await searchRes.json();
                        if (searchData.files && searchData.files.length > 0) {
                            resolvedFolderId = searchData.files[0].id;
                            console.log(`[GenericNode:google-drive] Auto-selected "Classroom" folder: ${resolvedFolderId}`);
                        } else {
                            console.log('[GenericNode:google-drive] No Classroom folder found, falling back to root.');
                            resolvedFolderId = 'root';
                        }
                    } else {
                        resolvedFolderId = 'root';
                    }
                } catch (e) {
                    resolvedFolderId = 'root';
                }
            }

            switch (action) {
                case 'list-files':
                    // If folderId is 'root' but they didn't explicitly set it, 
                    // broad search might be better to show "real time data"
                    if (folderId === 'root' || !folderId) {
                        endpoint = `/files?q=trashed = false&orderBy=modifiedTime desc&pageSize=20&fields=files(id, name, mimeType, webViewLink, modifiedTime)`;
                    } else {
                        endpoint = `/files?q='${resolvedFolderId}' in parents and trashed = false&orderBy=modifiedTime desc&fields=files(id, name, mimeType, webViewLink, modifiedTime)`;
                    }
                    break;
                case 'create-folder':
                    method = 'POST';
                    endpoint = '/files?fields=id,name,webViewLink';
                    body = JSON.stringify({
                        name: this.config.folderName || 'New Folder',
                        mimeType: 'application/vnd.google-apps.folder',
                        parents: [resolvedFolderId]
                    });
                    break;
                case 'delete-file':
                    method = 'DELETE';
                    endpoint = `/files/${this.config.fileId}`;
                    break;
                case 'get-file':
                    endpoint = `/files/${this.config.fileId}?fields=id, name, mimeType, webViewLink, size, modifiedTime`;
                    break;
                default:
                    endpoint = '/files';
            }

            const response = await fetch(`${baseUrl}${endpoint}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body,
            });

            if (!response.ok) {
                const errorText = await response.text();

                // Detect "API Not Enabled"
                if (errorText.includes('accessNotConfigured') || errorText.includes('SERVICE_DISABLED')) {
                    const activationUrlMatch = errorText.match(/https:\/\/console\.developers\.google\.com\/[^\s"]+/);
                    const activationUrl = activationUrlMatch ? activationUrlMatch[0] : 'https://console.cloud.google.com/apis/library';
                    throw new Error(`Google Drive API is currently disabled in your Google Cloud Project. Please enable it using this link and try again: ${activationUrl}`);
                }

                throw new Error(`Google Drive API error: ${response.status} - ${errorText}`);
            }

            // Handle DELETE response (usually 204 No Content)
            if (method === 'DELETE') {
                return {
                    success: true,
                    nodeType: this.nodeType,
                    label: this.nodeLabel,
                    message: 'Drive item deleted successfully',
                    timestamp: new Date().toISOString(),
                    output: { action, success: true }
                };
            }

            const data = await response.json();

            return {
                success: true,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: `Google Drive ${action} successful`,
                timestamp: new Date().toISOString(),
                output: {
                    action,
                    files: data.files || [],
                    file: data.id ? data : undefined,
                }
            };
        } catch (error) {
            console.error('[GenericNode:google-drive] Error:', error);
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Failed to access Google Drive',
                timestamp: new Date().toISOString(),
                output: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }

    // ==================== GOOGLE FORMS ====================

    private async executeGoogleForms(credentials: Record<string, any>) {
        const accessToken = credentials?.accessToken || process.env.GOOGLE_ACCESS_TOKEN;
        // Handle both get-responses and get_responses
        let action = (this.config.action || 'get_responses').replace(/-/g, '_');
        let formId = this.config.formId;

        if (!accessToken) {
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Google Forms access token required',
                timestamp: new Date().toISOString(),
                output: { error: 'No Google Forms credentials configured' }
            };
        }

        // Extract ID from URL if provided
        if (formId && formId.includes('/d/')) {
            // Updated regex to handle:
            // 1. /d/ID/edit
            // 2. /d/e/ID/viewform (published forms)
            const match = formId.match(/\/d\/(?:e\/)?([a-zA-Z0-9_-]+)/);
            if (match && match[1] !== 'e') {
                formId = match[1];
                console.log(`[GenericNode:google-forms] Extracted ID from URL: ${formId}`);
            }
        }

        // AUTO-FETCH FORM ID: If empty, find the most recent form from Google Drive
        if (!formId || formId === '' || formId === 'auto') {
            console.log('[GenericNode:google-forms] No formId provided, searching for most recent Google Form...');
            try {
                const driveSearchRes = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType = "application/vnd.google-apps.form" and trashed = false&orderBy=modifiedTime desc&pageSize=1&fields=files(id, name)', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                if (driveSearchRes.ok) {
                    const searchData = await driveSearchRes.json();
                    if (searchData.files && searchData.files.length > 0) {
                        formId = searchData.files[0].id;
                        console.log(`[GenericNode:google-forms] Auto-discovered form: "${searchData.files[0].name}" (ID: ${formId})`);
                    } else {
                        throw new Error('No Google Forms found in your account. Please create one first or paste the Form URL.');
                    }
                } else {
                    const errText = await driveSearchRes.text();
                    throw new Error(`Failed to auto-discover forms: ${errText}`);
                }
            } catch (e) {
                console.error('[GenericNode:google-forms] Auto-discovery failed:', e);
                return {
                    success: false,
                    nodeType: this.nodeType,
                    label: this.nodeLabel,
                    message: 'Form ID required and auto-discovery failed',
                    timestamp: new Date().toISOString(),
                    output: { error: e instanceof Error ? e.message : 'Unknown error' }
                };
            }
        }

        try {
            const baseUrl = 'https://forms.googleapis.com/v1';
            let endpoint = '';

            // Map actions to endpoints
            switch (action) {
                case 'get_responses':
                    endpoint = `/forms/${formId}/responses`;
                    break;
                case 'get_form':
                    endpoint = `/forms/${formId}`;
                    break;
                default:
                    endpoint = `/forms/${formId}`;
            }

            console.log(`[GenericNode:google-forms] Fetching: ${baseUrl}${endpoint}`);
            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();

                // If 404, let's double check if the file is even visible in Drive
                if (response.status === 404) {
                    try {
                        const driveCheck = await fetch(`https://www.googleapis.com/drive/v3/files/${formId}?fields=id,name,mimeType`, {
                            headers: { 'Authorization': `Bearer ${accessToken}` }
                        });

                        if (driveCheck.ok) {
                            const driveData = await driveCheck.json();
                            throw new Error(`The form "${driveData.name}" was found, but the Google Forms API cannot access it. This usually means: 1. You haven't enabled the "Google Forms API" in your Google Cloud Console for this project. 2. You didn't check the "View Google Forms" permission when logging in.`);
                        } else {
                            throw new Error(`The form with ID "${formId}" could not be found in your Google Drive. Please ensure the URL is correct and you have access to this form.`);
                        }
                    } catch (driveErr: any) {
                        if (driveErr.message.includes('Google Forms API')) throw driveErr;
                        throw new Error(`Google Forms API error: 404. The form was not found or the API is disabled: ${errorText}`);
                    }
                }

                // Detect "API Not Enabled"
                if (errorText.includes('accessNotConfigured') || errorText.includes('SERVICE_DISABLED')) {
                    const activationUrl = 'https://console.cloud.google.com/apis/library/forms.googleapis.com';
                    throw new Error(`Google Forms API is disabled. Please enable it here: ${activationUrl}`);
                }

                if (response.status === 403) {
                    throw new Error('Insufficient Permissions: Please ensure Google Forms scopes are requested during sign-in.');
                }
                throw new Error(`Google Forms API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            return {
                success: true,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: `Google Forms ${action.replace(/_/g, ' ')} successful`,
                timestamp: new Date().toISOString(),
                output: {
                    formId,
                    action,
                    responses: action === 'get_responses' ? (data.responses || []) : undefined,
                    form: action === 'get_form' ? data : undefined,
                    totalResponses: action === 'get_responses' ? (data.responses?.length || 0) : undefined,
                }
            };
        } catch (error) {
            console.error('[GenericNode:google-forms] Error:', error);
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Failed to access Google Forms',
                timestamp: new Date().toISOString(),
                output: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }

    // ==================== GOOGLE MEET ====================

    private async executeGoogleMeet(credentials: Record<string, any>) {
        const accessToken = credentials?.accessToken || process.env.GOOGLE_ACCESS_TOKEN;
        const topic = this.config.title || this.config.topic || 'EduFlow Meeting';

        if (!accessToken) {
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Google Meet access token required',
                timestamp: new Date().toISOString(),
                output: { error: 'No Google credentials configured' }
            };
        }

        try {
            // Google Meet is typically created via Calendar API
            const baseUrl = 'https://www.googleapis.com/calendar/v3';
            const requestId = `meet-${Date.now()}`;

            const response = await fetch(`${baseUrl}/calendars/primary/events?conferenceDataVersion=1`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    summary: topic,
                    description: this.config.description || 'Meeting created via EduFlow',
                    start: {
                        dateTime: new Date().toISOString(),
                        timeZone: 'UTC',
                    },
                    end: {
                        dateTime: new Date(Date.now() + (this.config.duration || 60) * 60 * 1000).toISOString(),
                        timeZone: 'UTC',
                    },
                    conferenceData: {
                        createRequest: {
                            requestId,
                            conferenceSolutionKey: { type: 'hangoutsMeet' },
                        },
                    },
                    attendees: this.config.attendees?.split(',').map((email: string) => ({ email: email.trim() })) || [],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();

                // Detect "API Not Enabled"
                if (errorText.includes('accessNotConfigured') || errorText.includes('SERVICE_DISABLED')) {
                    const activationUrlMatch = errorText.match(/https:\/\/console\.developers\.google\.com\/[^\s"]+/);
                    const activationUrl = activationUrlMatch ? activationUrlMatch[0] : 'https://console.cloud.google.com/apis/library';
                    throw new Error(`Google Calendar API (required for Meet) is disabled. Please enable it here: ${activationUrl}`);
                }

                if (response.status === 403) {
                    throw new Error('Insufficient Permissions: Google Meet requires "https://www.googleapis.com/auth/calendar.events" scope to be enabled.');
                }
                throw new Error(`Google Meet creation error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const meetLink = data.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;

            return {
                success: true,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Google Meet created successfully',
                timestamp: new Date().toISOString(),
                output: {
                    meetingId: data.id,
                    meetLink,
                    summary: data.summary,
                    htmlLink: data.htmlLink,
                }
            };
        } catch (error) {
            console.error('[GenericNode:google-meet] Error:', error);
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Failed to create Google Meet',
                timestamp: new Date().toISOString(),
                output: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }

    // ==================== TRIGGER NODES ====================

    private executeTriggerSchedule(ctx: any) {
        return {
            success: true,
            nodeType: this.nodeType,
            label: this.nodeLabel,
            message: this.resultMessage,
            timestamp: new Date().toISOString(),
            output: {
                triggered: true,
                scheduledTime: this.config.scheduledTime || new Date().toISOString(),
                cronExpression: this.config.cronExpression || '* * * * *',
                nextRun: this.calculateNextRun(this.config.cronExpression),
                workflowId: ctx.workflowId,
            }
        };
    }

    private executeTriggerWebhook(input: any) {
        return {
            success: true,
            nodeType: this.nodeType,
            label: this.nodeLabel,
            message: this.resultMessage,
            timestamp: new Date().toISOString(),
            output: {
                triggered: true,
                webhookId: this.config.webhookId || `wh_${Date.now()}`,
                method: input?.method || 'POST',
                payload: input?.body || {},
                headers: input?.headers || { 'Content-Type': 'application/json' },
                receivedAt: new Date().toISOString(),
            },
        };
    }

    // ==================== GOOGLE CLASSROOM ====================

    private async executeGoogleClassroom(credentials: Record<string, any>) {
        // Check multiple credential sources
        const accessToken = credentials?.accessToken ||
            credentials?.access_token ||
            process.env.GOOGLE_ACCESS_TOKEN ||
            process.env.GOOGLE_CLASSROOM_ACCESS_TOKEN;
        const apiKey = credentials?.apiKey || process.env.GOOGLE_API_KEY;
        const action = this.config.action || 'list_courses';
        const courseId = typeof this.config.courseId === 'string' ? this.config.courseId.trim() : this.config.courseId;

        // Google Classroom API requires OAuth access token (not just API key)
        if (!accessToken) {
            console.warn('[GenericNode:google-classroom] No access token found in credentials, env, or clerk cache');
            console.log('[GenericNode:google-classroom] Credentials object keys:', Object.keys(credentials || {}));
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Google Classroom access token required',
                timestamp: new Date().toISOString(),
                output: {
                    error: 'Google Classroom requires OAuth authentication. Please ensure you are signed in with Google and have authorized the application. \n\nIf you are a developer, ensure GOOGLE_ACCESS_TOKEN is set in your .env file or that Clerk OAuth is correctly configured.',
                    action,
                    configured: false,
                    helpUrl: '/dashboard/integrations',
                    setupGuide: 'https://developers.google.com/classroom/guides/auth',
                }
            };
        }

        // Debug: Log token info (first/last few chars only for security)
        const tokenPreview = `${accessToken.substring(0, 10)}...${accessToken.substring(accessToken.length - 10)}`;
        console.log(`[GenericNode:google-classroom] Using token: ${tokenPreview}`);

        // Try to get token info to check scopes and email
        let userEmail = '';
        try {
            const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
            if (tokenInfoResponse.ok) {
                const tokenInfo = await tokenInfoResponse.json();
                userEmail = tokenInfo.email || '';
                console.log('[GenericNode:google-classroom] Token scopes:', tokenInfo.scope);
                console.log('[GenericNode:google-classroom] Using Google account:', userEmail);

                // Check if required scope is present
                if (action.includes('announcement') && !tokenInfo.scope?.includes('classroom.announcements')) {
                    console.warn('[GenericNode:google-classroom] Missing required scope for announcements!');
                    console.warn('[GenericNode:google-classroom] Current scopes:', tokenInfo.scope);
                }
            }
        } catch (e) {
            console.log('[GenericNode:google-classroom] Could not verify token scopes');
        }

        try {
            const apiUrl = 'https://classroom.googleapis.com/v1';
            let endpoint = '';
            let method = 'GET';
            let body: string | undefined;

            // Try to decode base64 course ID if it looks like one
            let resolvedCourseId = courseId;
            if (courseId) {
                // Check if it's base64 encoded (common pattern from some integrations)
                if (/^[A-Za-z0-9+/=]+$/.test(courseId) && courseId.length > 10) {
                    try {
                        const decoded = Buffer.from(courseId, 'base64').toString('utf-8');
                        if (/^\d+$/.test(decoded)) {
                            console.log(`[GenericNode:google-classroom] Decoded base64 courseId: ${courseId} -> ${decoded}`);
                            resolvedCourseId = decoded;
                        }
                    } catch (e) {
                        // Not base64, continue with original
                    }
                }
            }

            // AUTO-FETCH COURSE: If no courseId provided or it's empty, automatically get the first available course
            if (!resolvedCourseId || resolvedCourseId === '' || resolvedCourseId === 'auto') {
                console.log('[GenericNode:google-classroom] No courseId provided, auto-fetching courses...');

                try {
                    const coursesResponse = await fetch(`${apiUrl}/courses?teacherId=me&courseStates=ACTIVE`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (coursesResponse.ok) {
                        const coursesData = await coursesResponse.json();
                        const courses = coursesData.courses || [];

                        if (courses.length > 0) {
                            resolvedCourseId = courses[0].id;
                            console.log(`[GenericNode:google-classroom] Auto-selected course: "${courses[0].name}" (ID: ${courses[0].id})`);

                            // Log all available courses for reference
                            if (courses.length > 1) {
                                console.log('[GenericNode:google-classroom] Other available courses:');
                                courses.slice(1).forEach((c: any) => {
                                    console.log(`  - "${c.name}" (ID: ${c.id}, Code: ${c.enrollmentCode})`);
                                });
                            }
                        } else {
                            throw new Error('No courses found where you are a teacher. Please create a course in Google Classroom first.');
                        }
                    } else {
                        const errorText = await coursesResponse.text();
                        console.error('[GenericNode:google-classroom] Failed to auto-fetch courses:', errorText);
                        throw new Error('Failed to auto-fetch courses. Make sure you have teacher access to at least one Google Classroom course.');
                    }
                } catch (autoFetchError) {
                    console.error('[GenericNode:google-classroom] Auto-fetch error:', autoFetchError);
                    throw autoFetchError;
                }
            }
            // If courseId looks like an enrollment code (short alphanumeric, not numeric), try to find the actual course ID
            else if (!/^\d+$/.test(resolvedCourseId)) {
                console.log(`[GenericNode:google-classroom] CourseId "${resolvedCourseId}" looks like an enrollment code, looking up actual course ID...`);


                try {
                    // First try to get courses where user is a teacher (needed for posting)
                    // Include all course states to catch archived courses too
                    const coursesResponse = await fetch(`${apiUrl}/courses?teacherId=me&courseStates=ACTIVE&courseStates=ARCHIVED&courseStates=PROVISIONED&courseStates=DECLINED&courseStates=SUSPENDED`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (coursesResponse.ok) {
                        const coursesData = await coursesResponse.json();
                        const courses = coursesData.courses || [];

                        console.log(`[GenericNode:google-classroom] Found ${courses.length} courses where you are a teacher`);

                        if (courses.length === 0) {
                            // Try getting all courses (including where user is a student)
                            console.log('[GenericNode:google-classroom] No teacher courses found, trying all courses...');
                            const allCoursesResponse = await fetch(`${apiUrl}/courses`, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/json',
                                },
                            });

                            if (allCoursesResponse.ok) {
                                const allCoursesData = await allCoursesResponse.json();
                                const allCourses = allCoursesData.courses || [];
                                console.log(`[GenericNode:google-classroom] Found ${allCourses.length} total courses`);

                                if (allCourses.length === 0) {
                                    throw new Error('No courses found in your Google Classroom account. Make sure you are a teacher of at least one course.');
                                }

                                // Look for matching course
                                const matchingCourse = allCourses.find(
                                    (c: any) => c.enrollmentCode === courseId ||
                                        c.id === courseId ||
                                        c.name?.toLowerCase() === courseId.toLowerCase()
                                );

                                if (matchingCourse) {
                                    console.log(`[GenericNode:google-classroom] Found course: "${matchingCourse.name}" (ID: ${matchingCourse.id})`);
                                    console.warn(`[GenericNode:google-classroom] Note: You may need to be a teacher of this course to post announcements.`);
                                    resolvedCourseId = matchingCourse.id;
                                } else {
                                    console.log('[GenericNode:google-classroom] Available courses:');
                                    allCourses.forEach((c: any) => {
                                        console.log(`  - "${c.name}" (ID: ${c.id}, Code: ${c.enrollmentCode}, Role: ${c.teacherFolder ? 'Teacher' : 'Student'})`);
                                    });
                                    throw new Error(`Course "${courseId}" not found. Available courses shown in console.`);
                                }
                            }
                        } else {
                            // Look for matching course in teacher courses
                            const matchingCourse = courses.find(
                                (c: any) => c.enrollmentCode === courseId ||
                                    c.id === courseId ||
                                    c.name?.toLowerCase() === courseId.toLowerCase()
                            );

                            if (matchingCourse) {
                                console.log(`[GenericNode:google-classroom] Found course: "${matchingCourse.name}" (ID: ${matchingCourse.id})`);
                                resolvedCourseId = matchingCourse.id;
                            } else {
                                console.log('[GenericNode:google-classroom] Your courses as teacher:');
                                courses.forEach((c: any) => {
                                    console.log(`  - "${c.name}" (ID: ${c.id}, Code: ${c.enrollmentCode})`);
                                });
                                throw new Error(`Course "${courseId}" not found in your teacher courses. Check console for available courses.`);
                            }
                        }
                    } else {
                        const errorText = await coursesResponse.text();
                        console.error('[GenericNode:google-classroom] Failed to fetch courses:', errorText);
                        throw new Error('Failed to fetch courses list');
                    }
                } catch (lookupError) {
                    console.error('[GenericNode:google-classroom] Course lookup failed:', lookupError);
                    throw lookupError;
                }
            }

            // Define action handlers
            switch (action) {
                // === READ ACTIONS ===
                case 'list_courses':
                case 'list-courses':
                    endpoint = '/courses';
                    break;

                case 'get_course':
                case 'get-course':
                    if (!resolvedCourseId) throw new Error('Course ID is required for get_course action');
                    endpoint = `/courses/${resolvedCourseId}`;
                    break;

                case 'list_students':
                case 'list-students':
                    if (!resolvedCourseId) throw new Error('Course ID is required for list_students action');
                    endpoint = `/courses/${resolvedCourseId}/students`;
                    break;

                case 'list_teachers':
                case 'list-teachers':
                    if (!resolvedCourseId) throw new Error('Course ID is required for list_teachers action');
                    endpoint = `/courses/${resolvedCourseId}/teachers`;
                    break;

                case 'list_coursework':
                case 'list-coursework':
                    if (!resolvedCourseId) throw new Error('Course ID is required for list_coursework action');
                    endpoint = `/courses/${resolvedCourseId}/courseWork`;
                    break;

                case 'list_announcements':
                case 'list-announcements':
                    if (!resolvedCourseId) throw new Error('Course ID is required for list_announcements action');
                    endpoint = `/courses/${resolvedCourseId}/announcements`;
                    break;

                case 'list_submissions':
                case 'list-submissions':
                    if (!resolvedCourseId) throw new Error('Course ID is required');
                    if (!this.config.courseWorkId) throw new Error('CourseWork ID is required');
                    endpoint = `/courses/${resolvedCourseId}/courseWork/${this.config.courseWorkId}/studentSubmissions`;
                    break;

                // === WRITE ACTIONS ===
                case 'post_announcement':
                case 'post-announcement':
                case 'create_announcement':
                case 'create-announcement':
                    if (!resolvedCourseId) throw new Error('Course ID is required for posting announcement');
                    // Support multiple field names from different UI configurations
                    const announcementText = this.config.text || this.config.message || this.config.announcementText || this.config.content;
                    if (!announcementText) {
                        throw new Error('Announcement text is required. Provide it as "text", "message", "announcementText", or "content".');
                    }
                    method = 'POST';
                    endpoint = `/courses/${resolvedCourseId}/announcements`;
                    body = JSON.stringify({
                        text: announcementText,
                        state: this.config.state || 'PUBLISHED',
                        materials: this.config.materials || [],
                        assigneeMode: this.config.assigneeMode || 'ALL_STUDENTS',
                    });
                    break;


                case 'create_coursework':
                case 'create-coursework':
                case 'post_assignment':
                case 'post-assignment':
                    if (!resolvedCourseId) throw new Error('Course ID is required');
                    if (!this.config.title) throw new Error('Title is required for coursework');
                    method = 'POST';
                    endpoint = `/courses/${resolvedCourseId}/courseWork`;
                    body = JSON.stringify({
                        title: this.config.title,
                        description: this.config.description || '',
                        workType: this.config.workType || 'ASSIGNMENT',
                        state: this.config.state || 'PUBLISHED',
                        maxPoints: this.config.maxPoints || 100,
                        dueDate: this.config.dueDate ? {
                            year: new Date(this.config.dueDate).getFullYear(),
                            month: new Date(this.config.dueDate).getMonth() + 1,
                            day: new Date(this.config.dueDate).getDate(),
                        } : undefined,
                        dueTime: this.config.dueTime ? {
                            hours: parseInt(this.config.dueTime.split(':')[0]),
                            minutes: parseInt(this.config.dueTime.split(':')[1]) || 0,
                        } : undefined,
                        materials: this.config.materials || [],
                    });
                    break;

                case 'create_material':
                case 'create-material':
                case 'post_material':
                case 'post-material':
                    if (!resolvedCourseId) throw new Error('Course ID is required');
                    if (!this.config.title) throw new Error('Title is required for material');
                    method = 'POST';
                    endpoint = `/courses/${resolvedCourseId}/courseWorkMaterials`;
                    body = JSON.stringify({
                        title: this.config.title,
                        description: this.config.description || '',
                        state: this.config.state || 'PUBLISHED',
                        materials: this.config.materials || [],
                    });
                    break;

                case 'invite_student':
                case 'invite-student':
                    if (!resolvedCourseId) throw new Error('Course ID is required');
                    if (!this.config.email) throw new Error('Student email is required');
                    method = 'POST';
                    endpoint = `/courses/${resolvedCourseId}/students`;
                    body = JSON.stringify({
                        userId: this.config.email,
                    });
                    break;

                case 'invite_teacher':
                case 'invite-teacher':
                    if (!resolvedCourseId) throw new Error('Course ID is required');
                    if (!this.config.email) throw new Error('Teacher email is required');
                    method = 'POST';
                    endpoint = `/courses/${resolvedCourseId}/teachers`;
                    body = JSON.stringify({
                        userId: this.config.email,
                    });
                    break;

                case 'create_course':
                case 'create-course':
                    if (!this.config.name) throw new Error('Course name is required');
                    method = 'POST';
                    endpoint = '/courses';

                    const courseBody: any = {
                        name: this.config.name,
                        section: this.config.section || '',
                        description: this.config.description || '',
                        room: this.config.room || '',
                        ownerId: this.config.ownerId || 'me'
                    };

                    // Only add courseState if explicitly provided, otherwise let Google default it
                    if (this.config.courseState) {
                        courseBody.courseState = this.config.courseState;
                    }

                    body = JSON.stringify(courseBody);
                    break;

                case 'update_course':
                case 'update-course':
                    if (!resolvedCourseId) throw new Error('Course ID is required');
                    method = 'PATCH';
                    endpoint = `/courses/${resolvedCourseId}?updateMask=${this.config.updateMask || 'name,description,section,room'}`;
                    body = JSON.stringify({
                        name: this.config.name,
                        section: this.config.section,
                        description: this.config.description,
                        room: this.config.room,
                    });
                    break;

                case 'grade_submission':
                case 'grade-submission':
                    if (!resolvedCourseId) throw new Error('Course ID is required');
                    if (!this.config.courseWorkId) throw new Error('CourseWork ID is required');
                    if (!this.config.submissionId) throw new Error('Submission ID is required');
                    method = 'PATCH';
                    endpoint = `/courses/${resolvedCourseId}/courseWork/${this.config.courseWorkId}/studentSubmissions/${this.config.submissionId}?updateMask=assignedGrade,draftGrade`;
                    body = JSON.stringify({
                        assignedGrade: this.config.grade,
                        draftGrade: this.config.grade,
                    });
                    break;

                default:
                    console.warn(`[GenericNode:google-classroom] Unknown action: ${action}, defaulting to list_courses`);
                    endpoint = '/courses';
            }

            console.log(`[GenericNode:google-classroom] ${method} ${apiUrl}${endpoint}`);

            const response = await fetch(`${apiUrl}${endpoint}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[GenericNode:google-classroom] API error:', errorText);

                // Parse error for better messaging
                let errorMessage = `Google Classroom API error: ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error?.message || errorMessage;
                } catch {
                    // Use default message
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Build success response based on action type
            const isWriteAction = ['POST', 'PATCH', 'PUT'].includes(method);

            return {
                success: true,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: isWriteAction
                    ? `Google Classroom ${action.replace(/[-_]/g, ' ')} completed successfully`
                    : 'Google Classroom data fetched successfully',
                timestamp: new Date().toISOString(),
                output: {
                    action,
                    courseId,
                    // For write actions, return the created/updated resource
                    ...(isWriteAction && {
                        created: data,
                        resourceId: data.id,
                        resourceLink: data.alternateLink,
                    }),
                    // For read actions, return the list data
                    ...(!isWriteAction && {
                        data,
                        courses: data.courses || [],
                        students: data.students || [],
                        teachers: data.teachers || [],
                        courseWork: data.courseWork || [],
                        announcements: data.announcements || [],
                        submissions: data.studentSubmissions || [],
                        nextPageToken: data.nextPageToken,
                    }),
                }
            };
        } catch (error) {
            console.error('[GenericNode:google-classroom] Error:', error);
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Failed to execute Google Classroom action',
                timestamp: new Date().toISOString(),
                output: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    action,
                    courseId,
                }
            };
        }
    }

    // ==================== GOOGLE SHEETS ====================

    private async executeGoogleSheets(credentials: Record<string, any>, input: any) {
        const accessToken = credentials?.accessToken || process.env.GOOGLE_ACCESS_TOKEN;
        const apiKey = credentials?.apiKey || process.env.GOOGLE_API_KEY;
        const spreadsheetId = this.config.spreadsheetId;
        const range = this.config.range || 'A1:Z1000';
        const action = this.config.action || 'read';

        if (!accessToken && !apiKey) {
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Google Sheets credentials required',
                timestamp: new Date().toISOString(),
                output: {
                    error: 'No Google Sheets credentials configured',
                    configured: false,
                }
            };
        }

        // SMART ID: Extract ID if it's a full URL
        let resolvedSpreadsheetId = spreadsheetId;
        if (resolvedSpreadsheetId && resolvedSpreadsheetId.includes('/')) {
            const match = resolvedSpreadsheetId.match(/[-\w]{25,}/);
            if (match) resolvedSpreadsheetId = match[0];
        }

        // AUTO-DISCOVERY: If no ID, find the most recent spreadsheet
        if (!resolvedSpreadsheetId || resolvedSpreadsheetId === '' || resolvedSpreadsheetId === 'auto') {
            console.log('[GenericNode:google-sheets] Auto-discovering most recent spreadsheet...');
            try {
                // Determine if we should prioritize a specific name
                const targetName = this.config.sheetName;
                let queryParts = [
                    "(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'text/csv')",
                    "trashed = false"
                ];

                const query = encodeURIComponent(queryParts.join(" and "));

                // Fetch more files to improve hit rate (pageSize=50)
                const driveSearchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=50&fields=files(id, name, mimeType)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                if (driveSearchRes.ok) {
                    const searchData = await driveSearchRes.json();
                    const files = searchData.files || [];
                    console.log(`[GenericNode:google-sheets] Discovery found ${files.length} potential files.`);

                    if (files.length > 0) {
                        let selectedFile = null;

                        // 1. Try to find an exact match by name if targetName is provided
                        if (targetName) {
                            const cleanTarget = targetName.toLowerCase().replace(/\.(csv|xlsx|xls|gsheet)$/, '');
                            selectedFile = files.find((f: any) => {
                                const cleanFile = f.name.toLowerCase().replace(/\.(csv|xlsx|xls|gsheet)$/, '');
                                return f.name === targetName ||
                                    f.name.includes(targetName) ||
                                    targetName.includes(f.name) ||
                                    cleanFile === cleanTarget;
                            });
                        }

                        // 2. If no name match, prefer native Google Sheets
                        if (!selectedFile) {
                            selectedFile = files.find((f: any) => f.mimeType === 'application/vnd.google-apps.spreadsheet');
                        }

                        // 3. Fallback to the most recently modified file among common sheet formats
                        if (!selectedFile) {
                            selectedFile = files[0];
                        }

                        if (selectedFile) {
                            resolvedSpreadsheetId = selectedFile.id;
                            console.log(`[GenericNode:google-sheets] Auto-selected: "${selectedFile.name}" (${resolvedSpreadsheetId}) - Mime: ${selectedFile.mimeType}`);

                            // Warning for CSVs as they might not work with Sheets API directly
                            if (selectedFile.mimeType === 'text/csv') {
                                console.warn(`[GenericNode:google-sheets] Warning: Selected file "${selectedFile.name}" is a raw CSV. If execution fails, please open it in Google Sheets once to convert it.`);
                            }
                        }
                    } else {
                        throw new Error('No Google Sheets, Excel, or CSV files found in your Drive. Please create a spreadsheet or provide an ID manually.');
                    }
                } else {
                    const errorText = await driveSearchRes.text();
                    if (errorText.includes('accessNotConfigured') || errorText.includes('SERVICE_DISABLED')) {
                        const activationUrlMatch = errorText.match(/https:\/\/console\.developers\.google\.com\/[^\s"]+/);
                        const activationUrl = activationUrlMatch ? activationUrlMatch[0] : 'https://console.cloud.google.com/apis/library';
                        throw new Error(`Google Drive API (required for auto-connecting) is disabled. Please enable it here: ${activationUrl}`);
                    }
                    console.warn('[GenericNode:google-sheets] Drive search failed:', errorText);
                }
            } catch (e: any) {
                console.warn('[GenericNode:google-sheets] Discovery failed:', e.message);
                // If it's our explicit error, we keep it, otherwise generic fallback
                if (!e.message?.includes('No Google Sheets')) {
                    // Log but continue to allow it to fail later with "ID required"
                } else {
                    throw e;
                }
            }
        }

        if (!resolvedSpreadsheetId) {
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Spreadsheet ID required',
                timestamp: new Date().toISOString(),
                output: { error: 'No spreadsheet found. Please provide an ID or create a sheet.' }
            };
        }

        // SMART RANGE: If sheetName is provided, use it
        const sheetName = this.config.sheetName || '';
        let resolvedRange = range;
        if (sheetName && !resolvedRange.includes('!')) {
            resolvedRange = `${sheetName}!${resolvedRange}`;
        }

        try {
            const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${resolvedSpreadsheetId}`;
            let apiUrl = '';
            let method = 'GET';
            let body: string | undefined;

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            switch (action) {
                case 'read':
                    apiUrl = `${baseUrl}/values/${encodeURIComponent(resolvedRange)}`;
                    if (!accessToken) apiUrl += `?key=${apiKey}`;
                    break;
                case 'write':
                case 'append':
                    method = action === 'append' ? 'POST' : 'PUT';
                    apiUrl = `${baseUrl}/values/${encodeURIComponent(resolvedRange)}:${action === 'append' ? 'append' : 'update'}?valueInputOption=USER_ENTERED`;
                    body = JSON.stringify({
                        values: input?.data || this.config.data || [],
                    });
                    break;
                case 'clear':
                    method = 'POST';
                    apiUrl = `${baseUrl}/values/${encodeURIComponent(resolvedRange)}:clear`;
                    break;
                default:
                    apiUrl = `${baseUrl}/values/${encodeURIComponent(resolvedRange)}`;
            }

            let response = await fetch(apiUrl, {
                method,
                headers,
                body,
            });

            // ULTRA-SMART RECOVERY: If sheet name (e.g. "Sheet1") causes 404, try to find the real first sheet name
            if (!response.ok && response.status === 404) {
                console.log(`[GenericNode:google-sheets] 404 detected. Verifying spreadsheet existence...`);
                try {
                    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${resolvedSpreadsheetId}?fields=sheets.properties.title,properties.title`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });

                    if (!metaRes.ok) {
                        if (metaRes.status === 404) {
                            // Stage 2 check: Is it in Drive but not a spreadsheet?
                            try {
                                const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${resolvedSpreadsheetId}?fields=name,mimeType&supportsAllDrives=true`, {
                                    headers: { 'Authorization': `Bearer ${accessToken}` }
                                });
                                if (driveRes.ok) {
                                    const driveData = await driveRes.json();
                                    const mime = driveData.mimeType;
                                    if (mime === 'text/csv' || mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                                        throw new Error(`File "${driveData.name}" found in your Drive, but it's a ${mime === 'text/csv' ? 'CSV' : 'Excel'} file. The Google Sheets API can only read native Google Sheets. Please open this file in Google Sheets and save it as a native sheet.`);
                                    }
                                    throw new Error(`The file "${driveData.name}" exists, but it's not a Spreadsheet (Type: ${mime}).`);
                                }
                            } catch (driveErr: any) {
                                console.warn('[GenericNode:google-sheets] Drive verification failed:', driveErr.message);
                            }
                            throw new Error(`Spreadsheet NOT FOUND. The ID "${resolvedSpreadsheetId}" appears to be invalid or you don't have permission to access it.`);
                        }
                    } else {
                        const metaData = await metaRes.json();
                        const firstSheetTitle = metaData.sheets?.[0]?.properties?.title;
                        const spreadsheetTitle = metaData.properties?.title;

                        if (sheetName && firstSheetTitle && firstSheetTitle !== sheetName) {
                            console.log(`[GenericNode:google-sheets] Found spreadsheet "${spreadsheetTitle}" but range "${resolvedRange}" failed. Retrying with first sheet: "${firstSheetTitle}"...`);
                            const newResolvedRange = `${firstSheetTitle}!${range}`;
                            const newApiUrl = apiUrl.replace(encodeURIComponent(resolvedRange), encodeURIComponent(newResolvedRange));

                            const retryRes = await fetch(newApiUrl, { method, headers, body });
                            if (retryRes.ok) {
                                response = retryRes;
                                resolvedRange = newResolvedRange;
                            }
                        } else if (!sheetName && firstSheetTitle) {
                            // Unexpected 404 without a sheet name, maybe try prepending the first sheet title anyway
                            console.log(`[GenericNode:google-sheets] Found spreadsheet "${spreadsheetTitle}". Range failed without explicit sheet name. Retrying with "${firstSheetTitle}"...`);
                            const newResolvedRange = `${firstSheetTitle}!${range}`;
                            const newApiUrl = apiUrl.replace(encodeURIComponent(resolvedRange), encodeURIComponent(newResolvedRange));
                            const retryRes = await fetch(newApiUrl, { method, headers, body });
                            if (retryRes.ok) {
                                response = retryRes;
                                resolvedRange = newResolvedRange;
                            }
                        }
                    }
                } catch (recoveryErr: any) {
                    console.warn('[GenericNode:google-sheets] Sheet recovery failed:', recoveryErr.message);
                    // Re-throw if it's our specific "Spreadsheet NOT FOUND" error
                    if (recoveryErr.message?.includes('Spreadsheet NOT FOUND')) {
                        throw recoveryErr;
                    }
                }
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[GenericNode:google-sheets] API error:', errorText);

                if (response.status === 404) {
                    throw new Error(`Sheet or Range not found. Spreadsheet ID "${resolvedSpreadsheetId}" is valid (Found!), but the specific sheet or range "${resolvedRange}" does not exist.`);
                }

                throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            return {
                success: true,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: `Google Sheets ${action} successful`,
                timestamp: new Date().toISOString(),
                output: {
                    spreadsheetId: resolvedSpreadsheetId,
                    range: data.range || resolvedRange,
                    action,
                    rowsAffected: data.updatedRows || data.values?.length || 0,
                    data: data.values || [],
                    updatedCells: data.updatedCells,
                    clearedRange: data.clearedRange,
                }
            };
        } catch (error) {
            console.error('[GenericNode:google-sheets] Error:', error);
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Failed to access Google Sheets',
                timestamp: new Date().toISOString(),
                output: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    action,
                }
            };
        }
    }

    // ==================== GOOGLE CALENDAR ====================

    private async executeGoogleCalendar(credentials: Record<string, any>) {
        const accessToken = credentials?.accessToken || process.env.GOOGLE_ACCESS_TOKEN;
        const calendarId = this.config.calendarId || 'primary';
        const action = this.config.action || 'list_events';

        if (!accessToken) {
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Google Calendar access token required',
                timestamp: new Date().toISOString(),
                output: {
                    error: 'No Google Calendar credentials configured',
                    configured: false,
                }
            };
        }

        try {
            const baseUrl = 'https://www.googleapis.com/calendar/v3';
            let endpoint = '';
            let method = 'GET';
            let body: string | undefined;

            const now = new Date();
            const timeMin = now.toISOString();
            const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ahead

            // Canonicalize action names (handle both list-events and list_events)
            const normalizedAction = action.replace(/-/g, '_');

            switch (normalizedAction) {
                case 'list_events':
                    endpoint = `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
                    break;
                case 'get_event':
                    endpoint = `/calendars/${encodeURIComponent(calendarId)}/events/${this.config.eventId}`;
                    break;
                case 'create_event':
                    method = 'POST';
                    endpoint = `/calendars/${encodeURIComponent(calendarId)}/events`;

                    // Support both UI field names and standard names
                    const summary = this.config.eventTitle || this.config.summary || this.config.title || 'New Event';
                    const rawStart = this.config.startDate || this.config.startTime;
                    const rawEnd = this.config.endDate || this.config.endTime;

                    // Ensure ISO format for dates
                    const start = rawStart ? new Date(rawStart).toISOString() : new Date().toISOString();
                    const end = rawEnd ? new Date(rawEnd).toISOString() : new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();

                    // Parse attendees (handle comma-separated string or array)
                    let attendeesList = [];
                    if (typeof this.config.attendees === 'string' && this.config.attendees.trim()) {
                        attendeesList = this.config.attendees.split(',').map((email: string) => ({ email: email.trim() })).filter((a: any) => a.email);
                    } else if (Array.isArray(this.config.attendees)) {
                        attendeesList = this.config.attendees.map((item: any) => typeof item === 'string' ? { email: item.trim() } : item);
                    }

                    body = JSON.stringify({
                        summary,
                        description: this.config.description || this.config.agenda,
                        start: {
                            dateTime: start,
                        },
                        end: {
                            dateTime: end,
                        },
                        attendees: attendeesList,
                    });
                    break;
                case 'update_event':
                    method = 'PATCH';
                    const eventId = this.config.eventId || this.config.id;
                    if (!eventId) throw new Error("Event ID is required for update-event action");

                    endpoint = `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

                    const updateSummary = this.config.eventTitle || this.config.summary || this.config.title;
                    const updateStart = this.config.startDate || this.config.startTime;
                    const updateEnd = this.config.endDate || this.config.endTime;

                    // Parse attendees for update
                    let updateAttendeesList = undefined;
                    if (this.config.attendees !== undefined) {
                        if (typeof this.config.attendees === 'string') {
                            updateAttendeesList = this.config.attendees.split(',').map((email: string) => ({ email: email.trim() })).filter((a: any) => a.email);
                        } else if (Array.isArray(this.config.attendees)) {
                            updateAttendeesList = this.config.attendees.map((item: any) => typeof item === 'string' ? { email: item.trim() } : item);
                        }
                    }

                    body = JSON.stringify({
                        summary: updateSummary,
                        description: this.config.description || this.config.agenda,
                        start: updateStart ? { dateTime: new Date(updateStart).toISOString() } : undefined,
                        end: updateEnd ? { dateTime: new Date(updateEnd).toISOString() } : undefined,
                        attendees: updateAttendeesList,
                    });
                    break;
                case 'list_calendars':
                    endpoint = '/users/me/calendarList';
                    break;
                default:
                    endpoint = `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=10&singleEvents=true&orderBy=startTime`;
            }

            const response = await fetch(`${baseUrl}${endpoint}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[GenericNode:google-calendar] API error:', errorText);

                if (response.status === 403) {
                    throw new Error("Insufficient Permission. Creating events requires 'https://www.googleapis.com/auth/calendar.events' scope. Please ensure your Google integration has full Calendar access.");
                }

                throw new Error(`Google Calendar API error: ${response.status}`);
            }

            const data = await response.json();

            // Format events for easier consumption
            const formattedEvents = (data.items || []).map((event: any) => ({
                id: event.id,
                title: event.summary,
                description: event.description,
                start: event.start?.dateTime || event.start?.date,
                end: event.end?.dateTime || event.end?.date,
                location: event.location,
                attendees: event.attendees?.map((a: any) => a.email) || [],
                status: event.status,
                htmlLink: event.htmlLink,
            }));

            return {
                success: true,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Google Calendar data fetched successfully',
                timestamp: new Date().toISOString(),
                output: {
                    calendarId,
                    action,
                    events: formattedEvents,
                    calendars: data.items?.filter((i: any) => i.kind === 'calendar#calendarListEntry') || [],
                    totalEvents: formattedEvents.length,
                    nextPageToken: data.nextPageToken,
                    createdEvent: action === 'create_event' ? data : undefined,
                }
            };
        } catch (error) {
            console.error('[GenericNode:google-calendar] Error:', error);
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Failed to fetch Google Calendar data',
                timestamp: new Date().toISOString(),
                output: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    action,
                }
            };
        }
    }

    // ==================== ZOOM MEETING ====================

    private async executeZoomMeeting(credentials: Record<string, any>) {
        const accessToken = credentials?.accessToken || process.env.ZOOM_ACCESS_TOKEN;
        const apiKey = credentials?.apiKey || process.env.ZOOM_API_KEY;
        const apiSecret = credentials?.apiSecret || process.env.ZOOM_API_SECRET;
        const action = this.config.action || 'create';

        if (!accessToken && !(apiKey && apiSecret)) {
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Zoom credentials required',
                timestamp: new Date().toISOString(),
                output: {
                    error: 'No Zoom credentials configured. Please add Zoom integration.',
                    configured: false,
                }
            };
        }

        try {
            const baseUrl = 'https://api.zoom.us/v2';
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            let endpoint = '';
            let method = 'GET';
            let body: string | undefined;

            switch (action) {
                case 'create':
                    method = 'POST';
                    endpoint = '/users/me/meetings';
                    body = JSON.stringify({
                        topic: this.config.topic || 'EduFlow Meeting',
                        type: this.config.type || 2, // Scheduled meeting
                        start_time: this.config.startTime || new Date().toISOString(),
                        duration: this.config.duration || 60,
                        timezone: this.config.timezone || 'UTC',
                        agenda: this.config.agenda || this.config.description,
                        settings: {
                            host_video: this.config.hostVideo !== false,
                            participant_video: this.config.participantVideo !== false,
                            join_before_host: this.config.joinBeforeHost || false,
                            mute_upon_entry: this.config.muteOnEntry || true,
                            waiting_room: this.config.waitingRoom || true,
                            auto_recording: this.config.autoRecording || 'none',
                        },
                    });
                    break;
                case 'get':
                    endpoint = `/meetings/${this.config.meetingId}`;
                    break;
                case 'list':
                    endpoint = '/users/me/meetings';
                    break;
                case 'delete':
                    method = 'DELETE';
                    endpoint = `/meetings/${this.config.meetingId}`;
                    break;
                case 'update':
                    method = 'PATCH';
                    endpoint = `/meetings/${this.config.meetingId}`;
                    body = JSON.stringify({
                        topic: this.config.topic,
                        start_time: this.config.startTime,
                        duration: this.config.duration,
                    });
                    break;
                default:
                    endpoint = '/users/me/meetings';
            }

            const response = await fetch(`${baseUrl}${endpoint}`, {
                method,
                headers,
                body,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[GenericNode:zoom-meeting] API error:', errorText);
                throw new Error(`Zoom API error: ${response.status}`);
            }

            // Handle DELETE which returns no content
            if (method === 'DELETE') {
                return {
                    success: true,
                    nodeType: this.nodeType,
                    label: this.nodeLabel,
                    message: 'Zoom meeting deleted successfully',
                    timestamp: new Date().toISOString(),
                    output: {
                        action,
                        meetingId: this.config.meetingId,
                        deleted: true,
                    }
                };
            }

            const data = await response.json();

            return {
                success: true,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: `Zoom meeting ${action} successful`,
                timestamp: new Date().toISOString(),
                output: {
                    action,
                    meetingId: data.id,
                    topic: data.topic,
                    startTime: data.start_time,
                    duration: data.duration,
                    joinUrl: data.join_url,
                    startUrl: data.start_url,
                    password: data.password,
                    hostEmail: data.host_email,
                    meetings: data.meetings || [], // For list action
                    totalMeetings: data.total_records,
                }
            };
        } catch (error) {
            console.error('[GenericNode:zoom-meeting] Error:', error);
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Failed to execute Zoom meeting action',
                timestamp: new Date().toISOString(),
                output: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    action: this.config.action,
                }
            };
        }
    }

    // ==================== GRADE CALCULATE ====================

    private executeGradeCalculate(input: any) {
        const scores = this.config.scores || input?.scores || [];
        const weights = this.config.weights || input?.weights || [];
        const formula = this.config.formula || 'weighted_average';

        let calculatedGrade = 0;
        let letterGrade = 'F';

        if (scores.length > 0) {
            if (formula === 'weighted_average' && weights.length === scores.length) {
                const totalWeight = weights.reduce((a: number, b: number) => a + b, 0);
                calculatedGrade = scores.reduce((sum: number, score: number, i: number) =>
                    sum + (score * (weights[i] / totalWeight)), 0);
            } else {
                // Simple average
                calculatedGrade = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
            }

            // Convert to letter grade
            if (calculatedGrade >= 90) letterGrade = 'A';
            else if (calculatedGrade >= 80) letterGrade = 'B';
            else if (calculatedGrade >= 70) letterGrade = 'C';
            else if (calculatedGrade >= 60) letterGrade = 'D';
            else letterGrade = 'F';
        }

        return {
            success: true,
            nodeType: this.nodeType,
            label: this.nodeLabel,
            message: 'Grade calculated successfully',
            timestamp: new Date().toISOString(),
            output: {
                formula,
                inputScores: scores,
                weights,
                calculatedGrade: Math.round(calculatedGrade * 100) / 100,
                letterGrade,
                passed: calculatedGrade >= 60,
            }
        };
    }

    // ==================== AI SUMMARIZE ====================

    private async executeAISummarize(credentials: Record<string, any>, input: any) {
        const apiKey = credentials?.apiKey || process.env.OPENAI_API_KEY;
        const text = this.config.text || input?.text || '';
        const model = this.config.model || 'gpt-3.5-turbo';

        if (!apiKey) {
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'OpenAI API key required',
                timestamp: new Date().toISOString(),
                output: {
                    error: 'No OpenAI API key configured. Please add OpenAI integration.',
                    configured: false,
                }
            };
        }

        if (!text) {
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'No text provided to summarize',
                timestamp: new Date().toISOString(),
                output: {
                    error: 'No text provided',
                }
            };
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that summarizes text. Provide a concise summary and list key points. Also analyze the sentiment.',
                        },
                        {
                            role: 'user',
                            content: `Please summarize the following text and provide key points:\n\n${text}`,
                        },
                    ],
                    temperature: 0.5,
                    max_tokens: 500,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[GenericNode:ai-summarize] API error:', errorText);
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            const summary = data.choices?.[0]?.message?.content || '';

            // Parse key points from the response
            const keyPointsMatch = summary.match(/key\s*points?:?\s*\n?([\s\S]*?)(?=sentiment|$)/i);
            const keyPoints = keyPointsMatch
                ? keyPointsMatch[1].split(/\n|•|-/).filter((p: string) => p.trim()).slice(0, 5)
                : ['Summary generated'];

            // Simple sentiment detection
            const lowerSummary = summary.toLowerCase();
            let sentiment = 'neutral';
            if (lowerSummary.includes('positive') || lowerSummary.includes('good') || lowerSummary.includes('excellent')) {
                sentiment = 'positive';
            } else if (lowerSummary.includes('negative') || lowerSummary.includes('bad') || lowerSummary.includes('poor')) {
                sentiment = 'negative';
            }

            return {
                success: true,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Text summarized successfully',
                timestamp: new Date().toISOString(),
                output: {
                    originalLength: text.length,
                    summary: summary.slice(0, 1000), // Limit summary length
                    keyPoints,
                    sentiment,
                    model,
                    tokensUsed: data.usage?.total_tokens,
                }
            };
        } catch (error) {
            console.error('[GenericNode:ai-summarize] Error:', error);
            return {
                success: false,
                nodeType: this.nodeType,
                label: this.nodeLabel,
                message: 'Failed to summarize text',
                timestamp: new Date().toISOString(),
                output: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                }
            };
        }
    }

    // ==================== LOOP ====================

    private executeLoop(input: any) {
        const items = this.config.items || input?.items || [];
        const processed = items.map((item: any, index: number) => ({
            index,
            item,
            processed: true,
            processedAt: new Date().toISOString(),
        }));

        return {
            success: true,
            nodeType: this.nodeType,
            label: this.nodeLabel,
            message: `Processed ${items.length} items`,
            timestamp: new Date().toISOString(),
            output: {
                iterations: items.length,
                items,
                processed,
            }
        };
    }

    // ==================== FILTER ====================

    private executeFilter(input: any) {
        const data = input?.data || this.config.data || [];
        const condition = this.config.condition;
        const field = this.config.field;
        const operator = this.config.operator || 'equals';
        const value = this.config.value;

        let filtered = data;

        if (field && value !== undefined) {
            filtered = data.filter((item: any) => {
                const itemValue = item[field];
                switch (operator) {
                    case 'equals': return itemValue === value;
                    case 'not_equals': return itemValue !== value;
                    case 'contains': return String(itemValue).includes(String(value));
                    case 'greater': return itemValue > value;
                    case 'less': return itemValue < value;
                    case 'greater_equals': return itemValue >= value;
                    case 'less_equals': return itemValue <= value;
                    default: return true;
                }
            });
        }

        return {
            success: true,
            nodeType: this.nodeType,
            label: this.nodeLabel,
            message: `Filtered ${data.length} -> ${filtered.length} items`,
            timestamp: new Date().toISOString(),
            output: {
                originalCount: data.length,
                filteredCount: filtered.length,
                condition,
                field,
                operator,
                value,
                filtered,
            }
        };
    }

    // ==================== CONDITION ====================

    private executeCondition(input: any) {
        const conditionValue = this.config.value ?? input?.value;
        const operator = this.config.operator || 'equals';
        const compareValue = this.config.compareValue;
        let conditionMet = false;

        switch (operator) {
            case 'equals': conditionMet = conditionValue == compareValue; break;
            case 'not_equals': conditionMet = conditionValue != compareValue; break;
            case 'greater': conditionMet = conditionValue > compareValue; break;
            case 'less': conditionMet = conditionValue < compareValue; break;
            case 'greater_equals': conditionMet = conditionValue >= compareValue; break;
            case 'less_equals': conditionMet = conditionValue <= compareValue; break;
            case 'contains': conditionMet = String(conditionValue).includes(String(compareValue)); break;
            case 'not_contains': conditionMet = !String(conditionValue).includes(String(compareValue)); break;
            case 'is_empty': conditionMet = !conditionValue || conditionValue === ''; break;
            case 'not_empty': conditionMet = !!conditionValue && conditionValue !== ''; break;
            default: conditionMet = Boolean(conditionValue);
        }

        return {
            success: true,
            nodeType: this.nodeType,
            label: this.nodeLabel,
            message: `Condition ${conditionMet ? 'met' : 'not met'}`,
            timestamp: new Date().toISOString(),
            output: {
                conditionMet,
                operator,
                leftValue: conditionValue,
                rightValue: compareValue,
                branch: conditionMet ? 'true' : 'false',
            }
        };
    }

    // ==================== DELAY ====================

    private async executeDelay() {
        const delayMs = (this.config.seconds || 1) * 1000;
        const maxDelay = 30000; // Cap at 30 seconds for production
        const actualDelay = Math.min(delayMs, maxDelay);

        await new Promise(resolve => setTimeout(resolve, actualDelay));

        return {
            success: true,
            nodeType: this.nodeType,
            label: this.nodeLabel,
            message: `Delayed for ${actualDelay / 1000} seconds`,
            timestamp: new Date().toISOString(),
            output: {
                delayed: true,
                delaySeconds: this.config.seconds || 1,
                actualDelayMs: actualDelay,
                cappedAt: delayMs > maxDelay ? maxDelay / 1000 : undefined,
            }
        };
    }

    // ==================== DEFAULT ====================

    private executeDefault(ctx: any, input: any, startTime: number) {
        return {
            success: true,
            nodeType: this.nodeType,
            label: this.nodeLabel,
            message: this.resultMessage,
            timestamp: new Date().toISOString(),
            config: this.config,
            context: {
                workflowId: ctx.workflowId,
                runId: ctx.runId,
            },
            input,
            output: {
                ...this.resultData,
                processed: true,
                durationMs: Date.now() - startTime,
            }
        };
    }

    // ==================== UTILITY ====================

    private calculateNextRun(cronExpression?: string): string {
        // Simple next run calculation - add 1 minute for basic cron
        // For production, use a proper cron parser library
        const next = new Date();

        if (!cronExpression || cronExpression === '* * * * *') {
            // Every minute
            next.setMinutes(next.getMinutes() + 1);
        } else if (cronExpression.startsWith('0 * * * *')) {
            // Every hour
            next.setHours(next.getHours() + 1, 0, 0, 0);
        } else if (cronExpression.startsWith('0 0 * * *')) {
            // Daily
            next.setDate(next.getDate() + 1);
            next.setHours(0, 0, 0, 0);
        } else {
            // Default: next minute
            next.setMinutes(next.getMinutes() + 1);
        }

        return next.toISOString();
    }
}
