// app/(main)/(page)/dashboard/integration/whatsapp-web/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    QrCode,
    RefreshCw,
    CheckCircle2,
    XCircle,
    MessageCircle,
    Users,
    Smartphone,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function WhatsAppWebPage() {
    const { toast } = useToast();
    const [status, setStatus] = useState<{
        connected: boolean;
        qrCode: string | null;
        info: any;
        loading: boolean;
    }>({
        connected: false,
        qrCode: null,
        info: null,
        loading: true
    });
    const [groups, setGroups] = useState<Array<{ id: string; name: string; participants: number }>>([]);
    const [isInitializing, setIsInitializing] = useState(false);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);

    // Fetch status
    const fetchStatus = async () => {
        try {
            const response = await fetch('/api/whatsapp-web');
            const data = await response.json();
            setStatus({
                connected: data.connected,
                qrCode: data.qrCode,
                info: data.info,
                loading: false
            });
        } catch (error) {
            console.error('Failed to fetch WhatsApp Web status:', error);
            setStatus(prev => ({ ...prev, loading: false }));
        }
    };

    // Initialize WhatsApp Web
    const initializeWhatsApp = async () => {
        setIsInitializing(true);
        try {
            const response = await fetch('/api/whatsapp-web', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'initialize' })
            });
            const data = await response.json();

            if (data.ok) {
                toast({
                    title: "WhatsApp Web Started",
                    description: data.qrCode ? "Scan the QR code with your phone" : "Connecting...",
                });
                setStatus({
                    connected: data.connected,
                    qrCode: data.qrCode,
                    info: null,
                    loading: false
                });
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to initialize",
                variant: "destructive"
            });
        } finally {
            setIsInitializing(false);
        }
    };

    // Load groups
    const loadGroups = async () => {
        if (!status.connected) return;

        setIsLoadingGroups(true);
        try {
            const response = await fetch('/api/whatsapp-web', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get-groups' })
            });
            const data = await response.json();

            if (data.ok) {
                setGroups(data.groups);
                toast({
                    title: "Groups Loaded",
                    description: `Found ${data.groups.length} groups`,
                });
            }
        } catch (error) {
            console.error('Failed to load groups:', error);
        } finally {
            setIsLoadingGroups(false);
        }
    };

    useEffect(() => {
        fetchStatus();

        // Poll for status updates when QR code is shown
        const interval = setInterval(() => {
            if (!status.connected) {
                fetchStatus();
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [status.connected]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-green-50/20 dark:to-green-900/5">
            {/* Header */}
            <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/integration">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <MessageCircle className="w-6 h-6 text-green-600" />
                                WhatsApp Web Connection
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Connect your WhatsApp to send messages to groups
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Connection Status */}
                    <Card className="border-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="w-5 h-5" />
                                    Connection Status
                                </CardTitle>
                                <Badge
                                    variant={status.connected ? "default" : "secondary"}
                                    className={status.connected ? "bg-green-600" : ""}
                                >
                                    {status.loading ? "Checking..." : status.connected ? "Connected" : "Disconnected"}
                                </Badge>
                            </div>
                            <CardDescription>
                                {status.connected
                                    ? "Your WhatsApp is connected and ready to send messages"
                                    : "Connect your WhatsApp by scanning the QR code"
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {status.loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : status.connected ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-700 dark:text-green-400">
                                                WhatsApp Connected!
                                            </p>
                                            <p className="text-sm text-green-600 dark:text-green-500">
                                                You can now send messages to groups
                                            </p>
                                        </div>
                                    </div>

                                    {status.info && (
                                        <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                                            <p><strong>Phone:</strong> {status.info.wid?.user || 'N/A'}</p>
                                            <p><strong>Platform:</strong> {status.info.platform || 'N/A'}</p>
                                        </div>
                                    )}

                                    <Button
                                        onClick={fetchStatus}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refresh Status
                                    </Button>
                                </div>
                            ) : status.qrCode ? (
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg border-2 border-dashed">
                                        <QrCode className="w-12 h-12 text-green-600" />
                                        <div className="text-center">
                                            <p className="font-medium">Scan QR Code</p>
                                            <p className="text-sm text-muted-foreground">
                                                Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white rounded-lg">
                                            {/* QR Code would be displayed here */}
                                            <div className="w-48 h-48 bg-muted flex items-center justify-center rounded text-xs text-center p-4">
                                                QR Code displayed in server console.
                                                Check your terminal for the QR code.
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Waiting for scan... (auto-refreshes every 3 seconds)
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <XCircle className="w-8 h-8 text-amber-600" />
                                        <div>
                                            <p className="font-medium text-amber-700 dark:text-amber-400">
                                                Not Connected
                                            </p>
                                            <p className="text-sm text-amber-600 dark:text-amber-500">
                                                Click below to start the connection process
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={initializeWhatsApp}
                                        disabled={isInitializing}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        {isInitializing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Starting WhatsApp Web...
                                            </>
                                        ) : (
                                            <>
                                                <QrCode className="w-4 h-4 mr-2" />
                                                Connect WhatsApp
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-muted-foreground text-center">
                                        This will start a WhatsApp Web session. You'll need to scan a QR code with your phone.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Groups List */}
                    <Card className="border-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Your Groups
                                </CardTitle>
                                <Button
                                    onClick={loadGroups}
                                    disabled={!status.connected || isLoadingGroups}
                                    variant="outline"
                                    size="sm"
                                >
                                    {isLoadingGroups ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                            <CardDescription>
                                {status.connected
                                    ? "Load your WhatsApp groups to see available targets"
                                    : "Connect WhatsApp first to see your groups"
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!status.connected ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground">
                                        Connect WhatsApp to view your groups
                                    </p>
                                </div>
                            ) : groups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground mb-4">
                                        No groups loaded yet
                                    </p>
                                    <Button onClick={loadGroups} disabled={isLoadingGroups}>
                                        {isLoadingGroups ? "Loading..." : "Load Groups"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {groups.map((group) => (
                                        <div
                                            key={group.id}
                                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{group.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {group.participants} participants
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                Group
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Instructions */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>How to Use</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="font-bold text-green-600">1</span>
                                </div>
                                <div>
                                    <p className="font-medium">Connect WhatsApp</p>
                                    <p className="text-sm text-muted-foreground">
                                        Click "Connect WhatsApp" and scan the QR code with your phone
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="font-bold text-green-600">2</span>
                                </div>
                                <div>
                                    <p className="font-medium">Create a Workflow</p>
                                    <p className="text-sm text-muted-foreground">
                                        Add a "WhatsApp Group" node and enable "Send to Group"
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="font-bold text-green-600">3</span>
                                </div>
                                <div>
                                    <p className="font-medium">Enter Group Name</p>
                                    <p className="text-sm text-muted-foreground">
                                        Type your group name (e.g., "College Group") and run!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
