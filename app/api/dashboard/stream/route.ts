import { requireAuth } from '@/lib/auth';
import { broadcaster } from '@/lib/realtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const user = await requireAuth();

        const encoder = new TextEncoder();
        let isConnected = true;

        const stream = new ReadableStream({
            start(controller) {
                const initialMessage = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`;
                controller.enqueue(encoder.encode(initialMessage));

                const unsubscribe = broadcaster.subscribe('dashboard', (event) => {
                    if (!isConnected) return;

                    try {
                        const message = `data: ${JSON.stringify(event)}\n\n`;
                        controller.enqueue(encoder.encode(message));
                    } catch (error) {
                        console.error('Error sending SSE message:', error);
                    }
                });

                const keepaliveInterval = setInterval(() => {
                    if (!isConnected) {
                        clearInterval(keepaliveInterval);
                        return;
                    }

                    try {
                        const ping = `:keepalive\n\n`;
                        controller.enqueue(encoder.encode(ping));
                    } catch (error) {
                        console.error('Error sending keepalive:', error);
                        clearInterval(keepaliveInterval);
                    }
                }, 30000);

                request.signal.addEventListener('abort', () => {
                    isConnected = false;
                    unsubscribe();
                    clearInterval(keepaliveInterval);
                    try {
                        controller.close();
                    } catch (e) {
                        // Stream may already be closed
                    }
                });
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch (error) {
        console.error('Error in SSE stream:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return new Response('Unauthorized', { status: 401 });
        }

        return new Response('Internal Server Error', { status: 500 });
    }
}