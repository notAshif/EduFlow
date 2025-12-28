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
        initializing: boolean;
        error: string | null;
        info: any;
        loading: boolean;
    }>({
        connected: false,
        qrCode: null,
        initializing: false,
        error: null,
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
                initializing: data.initializing,
                error: data.error,
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
                    initializing: data.initializing || true,
                    error: null,
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
        <div className="min-h-screen bg-linear-to-br from-background via-background to-green-50/20 dark:to-green-900/5">
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
                                    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg border-2 border-dashed border-green-500/50 shadow-inner">
                                        <div className="text-center">
                                            <p className="font-bold text-lg text-green-700 dark:text-green-400">Scan QR Code</p>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Open WhatsApp on your phone → Linked Devices → Link a Device
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white rounded-xl shadow-lg border-4 border-white">
                                            {/* Generate QR code using a public API */}
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(status.qrCode)}`}
                                                alt="WhatsApp QR Code"
                                                className="w-48 h-48"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-green-600 animate-pulse mt-2">
                                            <RefreshCw className="w-3 h-3" />
                                            <span>Waiting for scan... auto-refreshes</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className={`flex items-center gap-3 p-4 rounded-lg ${status.error ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                                        {status.error ? <XCircle className="w-8 h-8 text-red-600" /> : <XCircle className="w-8 h-8 text-amber-600" />}
                                        <div>
                                            <p className={`font-medium ${status.error ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                                {status.error ? 'Connection Error' : 'Not Connected'}
                                            </p>
                                            <p className={`text-sm ${status.error ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'}`}>
                                                {status.error || (status.initializing ? 'Initializing session...' : 'Click below to start the connection process')}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={initializeWhatsApp}
                                        disabled={isInitializing || status.initializing}
                                        className="w-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20"
                                    >
                                        {isInitializing || status.initializing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Starting WhatsApp Web...
                                            </>
                                        ) : (
                                            <>
                                                <QrCode className="w-4 h-4 mr-2" />
                                                {status.error ? 'Retry Connection' : 'Connect WhatsApp'}
                                            </>
                                        )}
                                    </Button>
                                    {status.initializing && (
                                        <p className="text-center text-xs text-muted-foreground animate-pulse">
                                            Booting browser... this may take up to 20 seconds
                                        </p>
                                    )}
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
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                    <span className="font-bold text-green-600">1</span>
                                </div>
                                <div>
                                    <p className="font-medium">Connect WhatsApp</p>
                                    <p className="text-sm text-muted-foreground">
                                        Click &quot;Connect WhatsApp&quot; and scan the QR code with your phone
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                    <span className="font-bold text-green-600">2</span>
                                </div>
                                <div>
                                    <p className="font-medium">Create a Workflow</p>
                                    <p className="text-sm text-muted-foreground">
                                        Add a &quot;WhatsApp Group&quot; node and enable &quot;Send to Group&quot;
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                    <span className="font-bold text-green-600">3</span>
                                </div>
                                <div>
                                    <p className="font-medium">Enter Group Name</p>
                                    <p className="text-sm text-muted-foreground">
                                        Type your group name (e.g., &quot;College Group&quot;) and run!
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
