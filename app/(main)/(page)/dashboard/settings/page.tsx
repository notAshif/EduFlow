'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useUser, useClerk } from '@clerk/nextjs'
import {
    Settings,
    User,
    School,
    Bell,
    Shield,
    Palette,
    Key,
    Mail,
    Save,
    Loader2,
    Check,
    AlertTriangle,
    Trash2,
    Download,
    Upload,
    ExternalLink,
    Github,
    Chrome,
} from 'lucide-react'

type SettingsTab = 'profile' | 'organization' | 'notifications' | 'security' | 'appearance' | 'data'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser()
    const { openUserProfile } = useClerk()

    // Database user state
    const [dbUser, setDbUser] = useState<{
        id: string
        email: string
        firstName: string | null
        lastName: string | null
        role: string
        createdAt: string
    } | null>(null)

    // Organization state
    const [organization, setOrganization] = useState<{
        id: string
        name: string
        plan: string | null
        createdAt: string
    } | null>(null)

    // Form state
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [orgName, setOrgName] = useState('')

    // Notification preferences (stored locally for now)
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        workflowAlerts: true,
        attendanceAlerts: true,
        assignmentUpdates: true,
        systemUpdates: false,
        weeklyDigest: true,
    })

    // Appearance settings
    const [appearance, setAppearance] = useState({
        theme: 'system',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        compactMode: false,
    })

    // Fetch settings from database
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings')
                if (response.ok) {
                    const data = await response.json()
                    setDbUser(data.user)
                    setOrganization(data.organization)
                    setFirstName(data.user.firstName || '')
                    setLastName(data.user.lastName || '')
                    setOrgName(data.organization.name || '')
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (isClerkLoaded) {
            fetchSettings()
        }
    }, [isClerkLoaded])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    organizationName: orgName,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setDbUser(data.user)
                toast({
                    title: 'Settings Saved',
                    description: 'Your settings have been updated successfully.',
                })
            } else {
                throw new Error('Failed to save')
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save settings. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsSaving(false)
        }
    }

    const tabs = [
        { id: 'profile' as const, label: 'Profile', icon: User },
        { id: 'organization' as const, label: 'Organization', icon: School },
        { id: 'notifications' as const, label: 'Notifications', icon: Bell },
        { id: 'security' as const, label: 'Security', icon: Shield },
        { id: 'appearance' as const, label: 'Appearance', icon: Palette },
        { id: 'data' as const, label: 'Data & API', icon: Key },
    ]

    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-muted'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    )

    // Get connected accounts from Clerk
    const googleAccount = clerkUser?.externalAccounts?.find(acc => acc.provider === 'google')
    const githubAccount = clerkUser?.externalAccounts?.find(acc => acc.provider === 'github')

    if (!isClerkLoaded || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="w-7 h-7 text-primary" />
                        Settings
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your account settings and preferences
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <Card className="lg:w-64 shrink-0">
                    <CardContent className="p-2">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </CardContent>
                </Card>

                {/* Content */}
                <div className="flex-1 space-y-6">
                    {/* Profile Settings */}
                    {activeTab === 'profile' && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Your personal details synced with Clerk authentication</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Avatar from Clerk */}
                                    <div className="flex items-center gap-4">
                                        {clerkUser?.imageUrl ? (
                                            <img
                                                src={clerkUser.imageUrl}
                                                alt="Profile"
                                                className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/20"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                                                {firstName?.[0] || clerkUser?.firstName?.[0] || 'U'}
                                                {lastName?.[0] || clerkUser?.lastName?.[0] || ''}
                                            </div>
                                        )}
                                        <div>
                                            <Button variant="outline" size="sm" onClick={() => openUserProfile()}>
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Manage in Clerk
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Profile photo managed via Clerk
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="Enter first name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    className="pl-9"
                                                    value={clerkUser?.primaryEmailAddress?.emailAddress || dbUser?.email || ''}
                                                    disabled
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Email managed via Clerk authentication
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Role</Label>
                                            <div className="flex items-center gap-2 h-10">
                                                <Badge variant="secondary" className="text-sm capitalize">
                                                    {dbUser?.role || 'teacher'}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">Contact admin to change</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Account Created</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            }) : 'N/A'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Connected Accounts */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Connected Accounts</CardTitle>
                                    <CardDescription>Sign-in methods linked to your account</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Google */}
                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                <Chrome className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Google</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {googleAccount?.emailAddress || 'Not connected'}
                                                </p>
                                            </div>
                                        </div>
                                        {googleAccount ? (
                                            <Badge className="bg-green-100 text-green-700">Connected</Badge>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => openUserProfile()}>
                                                Connect
                                            </Button>
                                        )}
                                    </div>

                                    {/* GitHub */}
                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                                                <Github className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium">GitHub</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {githubAccount?.username ? `@${githubAccount.username}` : 'Not connected'}
                                                </p>
                                            </div>
                                        </div>
                                        {githubAccount ? (
                                            <Badge className="bg-green-100 text-green-700">Connected</Badge>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => openUserProfile()}>
                                                Connect
                                            </Button>
                                        )}
                                    </div>

                                    <p className="text-xs text-muted-foreground pt-2">
                                        Manage connected accounts in your <button onClick={() => openUserProfile()} className="text-primary hover:underline">Clerk profile</button>
                                    </p>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Organization Settings */}
                    {activeTab === 'organization' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Organization Settings</CardTitle>
                                <CardDescription>Manage your school or organization details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="orgName">Organization Name</Label>
                                    <Input
                                        id="orgName"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        placeholder="Enter organization name"
                                        disabled={dbUser?.role !== 'admin'}
                                    />
                                    {dbUser?.role !== 'admin' && (
                                        <p className="text-xs text-muted-foreground">
                                            Only administrators can change the organization name
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Organization ID</Label>
                                        <Input value={organization?.id || ''} disabled className="font-mono text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Plan</Label>
                                        <div className="flex items-center gap-2 h-10">
                                            <Badge variant={organization?.plan === 'pro' ? 'default' : 'secondary'} className="capitalize">
                                                {organization?.plan || 'free'}
                                            </Badge>
                                            {organization?.plan !== 'pro' && (
                                                <Button variant="link" size="sm" className="h-auto p-0">
                                                    Upgrade
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Created</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        }) : 'N/A'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>Choose how and when you want to be notified</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    {[
                                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                                        { key: 'workflowAlerts', label: 'Workflow Alerts', desc: 'When workflows complete or fail' },
                                        { key: 'attendanceAlerts', label: 'Attendance Alerts', desc: 'Daily attendance summaries' },
                                        { key: 'assignmentUpdates', label: 'Assignment Updates', desc: 'New submissions and deadlines' },
                                        { key: 'systemUpdates', label: 'System Updates', desc: 'Platform maintenance and updates' },
                                        { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary email' },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm">{item.label}</p>
                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                            </div>
                                            <Toggle
                                                checked={notifications[item.key as keyof typeof notifications]}
                                                onChange={(val) => setNotifications({ ...notifications, [item.key]: val })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account Security</CardTitle>
                                    <CardDescription>Manage your security settings via Clerk</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                                <Check className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Password & Security</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Managed via Clerk authentication
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="outline" onClick={() => openUserProfile()}>
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Manage Security
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Two-Factor Authentication</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Add extra security to your account
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="outline" onClick={() => openUserProfile()}>
                                            Configure
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                                <Key className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Active Sessions</p>
                                                <p className="text-sm text-muted-foreground">
                                                    View and manage active sessions
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="outline" onClick={() => openUserProfile()}>
                                            View Sessions
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Appearance Settings */}
                    {activeTab === 'appearance' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance</CardTitle>
                                <CardDescription>Customize how EduFlow looks and feels</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Theme</Label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'light', label: 'Light' },
                                            { id: 'dark', label: 'Dark' },
                                            { id: 'system', label: 'System' },
                                        ].map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setAppearance({ ...appearance, theme: theme.id })}
                                                className={`px-4 py-2 rounded-lg border-2 transition-colors ${appearance.theme === theme.id
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-muted hover:border-primary/50'
                                                    }`}
                                            >
                                                {theme.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="language">Language</Label>
                                        <select
                                            id="language"
                                            value={appearance.language}
                                            onChange={(e) => setAppearance({ ...appearance, language: e.target.value })}
                                            className="w-full h-10 px-3 rounded-md border bg-background"
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                            <option value="hi">Hindi</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dateFormat">Date Format</Label>
                                        <select
                                            id="dateFormat"
                                            value={appearance.dateFormat}
                                            onChange={(e) => setAppearance({ ...appearance, dateFormat: e.target.value })}
                                            className="w-full h-10 px-3 rounded-md border bg-background"
                                        >
                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="timeFormat">Time Format</Label>
                                        <select
                                            id="timeFormat"
                                            value={appearance.timeFormat}
                                            onChange={(e) => setAppearance({ ...appearance, timeFormat: e.target.value })}
                                            className="w-full h-10 px-3 rounded-md border bg-background"
                                        >
                                            <option value="12h">12-hour (1:30 PM)</option>
                                            <option value="24h">24-hour (13:30)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">Compact Mode</p>
                                        <p className="text-xs text-muted-foreground">Reduce spacing for more content</p>
                                    </div>
                                    <Toggle
                                        checked={appearance.compactMode}
                                        onChange={(val) => setAppearance({ ...appearance, compactMode: val })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Data & API Settings */}
                    {activeTab === 'data' && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Data Export</CardTitle>
                                    <CardDescription>Download your data</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Button variant="outline">
                                            <Download className="w-4 h-4 mr-2" />
                                            Export All Data
                                        </Button>
                                        <Button variant="outline">
                                            <Upload className="w-4 h-4 mr-2" />
                                            Import Data
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Export includes workflows, attendance records, and assignments.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-red-200">
                                <CardHeader>
                                    <CardTitle className="text-red-600 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        Danger Zone
                                    </CardTitle>
                                    <CardDescription>Irreversible actions</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Once you delete your account, there is no going back. All your data will be permanently removed.
                                    </p>
                                    <Button variant="destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Account
                                    </Button>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
