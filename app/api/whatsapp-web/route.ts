// app/api/whatsapp-web/route.ts
// API endpoint to manage WhatsApp Web connection and send messages

import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppWebService } from '@/lib/services/whatsapp-web';
import { getCurrentUser } from '@/lib/auth';

// GET - Get WhatsApp Web status and QR code
export async function GET(request: NextRequest) {
    try {
        const service = getWhatsAppWebService();
        const status = await service.getStatus();

        return NextResponse.json({
            ok: true,
            connected: status.connected,
            qrCode: status.qrCode,
            initializing: status.initializing,
            error: status.error,
            info: status.info,
            message: status.connected
                ? 'WhatsApp Web is connected'
                : status.qrCode
                    ? 'Scan QR code to connect'
                    : status.initializing
                        ? 'Booting up WhatsApp Web...'
                        : 'WhatsApp Web not initialized'
        });
    } catch (error) {
        console.error('[WHATSAPP-WEB API] Error:', error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Failed to get status' },
            { status: 500 }
        );
    }
}

// POST - Initialize or send messages
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, to, message, isGroup, groupName, messages } = body;

        const service = getWhatsAppWebService();

        switch (action) {
            case 'initialize':
                // Start WhatsApp Web client
                const user = await getCurrentUser();
                const orgId = user?.organizationId;

                if (orgId) {
                    console.log(`[WHATSAPP-API] Initializing for Organization: ${orgId}`);
                }

                await service.initialize(orgId);
                const initStatus = await service.getStatus();

                return NextResponse.json({
                    ok: true,
                    message: 'WhatsApp Web initialization started',
                    connected: initStatus.connected,
                    qrCode: initStatus.qrCode
                });

            case 'send':
                // Send single message
                if (!to || !message) {
                    return NextResponse.json(
                        { ok: false, error: 'Missing "to" or "message" field' },
                        { status: 400 }
                    );
                }

                const result = await service.sendMessage(to, message, isGroup || false);
                return NextResponse.json({
                    ok: result.success,
                    ...result
                });

            case 'send-to-group':
                // Send to group by name
                if (!groupName || !message) {
                    return NextResponse.json(
                        { ok: false, error: 'Missing "groupName" or "message" field' },
                        { status: 400 }
                    );
                }

                const group = await service.findGroupByName(groupName);
                if (!group) {
                    return NextResponse.json(
                        { ok: false, error: `Group "${groupName}" not found` },
                        { status: 404 }
                    );
                }

                const groupResult = await service.sendMessage(group.id, message, true);
                return NextResponse.json({
                    ok: groupResult.success,
                    group: group,
                    ...groupResult
                });

            case 'send-bulk':
                // Send multiple messages
                if (!messages || !Array.isArray(messages)) {
                    return NextResponse.json(
                        { ok: false, error: 'Missing "messages" array' },
                        { status: 400 }
                    );
                }

                const bulkResults = await service.sendBulk(messages);
                const successCount = bulkResults.filter(r => r.success).length;

                return NextResponse.json({
                    ok: successCount > 0,
                    results: bulkResults,
                    successCount,
                    totalCount: messages.length
                });

            case 'get-groups':
                // List all groups
                try {
                    const groups = await service.getGroups();
                    return NextResponse.json({
                        ok: true,
                        groups,
                        count: groups.length
                    });
                } catch (err: any) {
                    if (err.message?.includes('not ready')) {
                        return NextResponse.json({
                            ok: false,
                            error: 'WhatsApp Web is not connected.',
                            groups: [],
                            count: 0
                        });
                    }
                    throw err;
                }

            case 'get-chats':
                // List all chats (individuals and groups)
                try {
                    const chatsList = await service.getChatsList();
                    return NextResponse.json({
                        ok: true,
                        chats: chatsList,
                        count: chatsList.length
                    });
                } catch (err: any) {
                    if (err.message?.includes('not ready')) {
                        return NextResponse.json({
                            ok: false,
                            error: 'WhatsApp Web is not connected.',
                            chats: [],
                            count: 0
                        });
                    }
                    throw err;
                }

            case 'status':
                // Just get status
                const statusResult = await service.getStatus();
                return NextResponse.json({
                    ok: true,
                    ...statusResult
                });

            default:
                return NextResponse.json(
                    { ok: false, error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('[WHATSAPP-WEB API] Error:', error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Operation failed' },
            { status: 500 }
        );
    }
}
