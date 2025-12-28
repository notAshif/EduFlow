'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Search,
    Plus,
    ExternalLink,
    Settings,
    Download,
    BookOpen,
    GraduationCap,
    Users,
    Calendar,
    FileText,
    Mail,
    MessageSquare,
    Bell,
    ClipboardCheck,
    BarChart3,
    Video,
    FolderOpen,
    Phone,
    PenTool,
    Brain,
    Globe,
    Slack,
    X,
    Save,
    Trash2,
    AlertCircle,
    Loader2,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Zap,
    Link2,
    Unlink,
    FormInput,
    CheckSquare
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface IntegrationConfig {
    apiKey?: string
    webhookUrl?: string
    clientId?: string
    clientSecret?: string
    phoneNumber?: string
    email?: string
    customField1?: string
    customField2?: string
}

interface Integration {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    iconBg: string
    iconColor: string
    url: string
    category: 'lms' | 'communication' | 'grading' | 'scheduling' | 'storage' | 'analytics' | 'ai' | 'custom'
    enabled: boolean
    popular?: boolean
    configFields: string[]
    config?: IntegrationConfig
    connectionStatus: 'connected' | 'disconnected' | 'testing' | 'error'
    lastTested?: string
    errorMessage?: string
}

const defaultIntegrations: Integration[] = [
    // Learning Management Systems
    {
        id: 'google-classroom',
        name: 'Google Classroom',
        description: 'Sync assignments, grades, and student rosters automatically with Google Classroom.',
        icon: <GraduationCap className="w-6 h-6" />,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        url: 'classroom.google.com',
        category: 'lms',
        enabled: false,
        popular: true,
        configFields: ['clientId', 'clientSecret'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'canvas',
        name: 'Canvas LMS',
        description: 'Connect with Canvas for seamless grade sync and assignment management.',
        icon: <BookOpen className="w-6 h-6" />,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        url: 'canvas.instructure.com',
        category: 'lms',
        enabled: false,
        popular: true,
        configFields: ['apiKey', 'customField1'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'schoology',
        name: 'Schoology',
        description: 'Integrate with Schoology to automate course materials and assessments.',
        icon: <BookOpen className="w-6 h-6" />,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        url: 'schoology.com',
        category: 'lms',
        enabled: false,
        configFields: ['apiKey', 'clientId'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'moodle',
        name: 'Moodle',
        description: 'Connect your Moodle instance for comprehensive learning management.',
        icon: <GraduationCap className="w-6 h-6" />,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        url: 'moodle.org',
        category: 'lms',
        enabled: false,
        configFields: ['apiKey', 'customField1'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'whatsapp-web',
        name: 'WhatsApp Web',
        description: 'Connect via QR code to send messages to groups and individuals.',
        icon: <Phone className="w-6 h-6" />,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        url: 'web.whatsapp.com',
        category: 'communication',
        enabled: false,
        popular: true,
        configFields: [],
        connectionStatus: 'disconnected',
    },
    {
        id: 'gmail',
        name: 'Gmail / Email',
        description: 'Send assignment reminders, report cards, and newsletters to students and parents.',
        icon: <Mail className="w-6 h-6" />,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-500',
        url: 'mail.google.com',
        category: 'communication',
        enabled: false,
        configFields: ['email', 'clientId', 'clientSecret'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'slack',
        name: 'Slack',
        description: 'Collaborate with staff and send workflow notifications to Slack channels.',
        icon: <Slack className="w-6 h-6" />,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        url: 'slack.com',
        category: 'communication',
        enabled: false,
        configFields: ['webhookUrl'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'discord',
        name: 'Discord',
        description: 'Engage students in Discord communities with automated announcements.',
        icon: <MessageSquare className="w-6 h-6" />,
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        url: 'discord.com',
        category: 'communication',
        enabled: false,
        configFields: ['webhookUrl'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'remind',
        name: 'Remind',
        description: 'Send safe, simple messages to students and parents through Remind.',
        icon: <Bell className="w-6 h-6" />,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-500',
        url: 'remind.com',
        category: 'communication',
        enabled: false,
        configFields: ['apiKey'],
        connectionStatus: 'disconnected',
    },

    // Grading & Assessment
    {
        id: 'turnitin',
        name: 'Turnitin',
        description: 'Check student submissions for plagiarism and provide feedback automatically.',
        icon: <ClipboardCheck className="w-6 h-6" />,
        iconBg: 'bg-teal-100',
        iconColor: 'text-teal-600',
        url: 'turnitin.com',
        category: 'grading',
        enabled: false,
        configFields: ['apiKey', 'clientId'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'gradescope',
        name: 'Gradescope',
        description: 'Automate grading with AI-assisted assessment and rubric-based feedback.',
        icon: <PenTool className="w-6 h-6" />,
        iconBg: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
        url: 'gradescope.com',
        category: 'grading',
        enabled: false,
        configFields: ['apiKey'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'kahoot',
        name: 'Kahoot!',
        description: 'Create and sync quiz results from Kahoot! for gamified assessments.',
        icon: <Brain className="w-6 h-6" />,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        url: 'kahoot.com',
        category: 'grading',
        enabled: false,
        configFields: ['apiKey'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'google-forms',
        name: 'Google Forms',
        description: 'Automate data collection and student assessments with Google Forms.',
        icon: <CheckSquare className="w-6 h-6" />,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        url: 'forms.google.com',
        category: 'grading',
        enabled: false,
        configFields: ['clientId', 'clientSecret'],
        connectionStatus: 'disconnected',
    },

    // Scheduling
    {
        id: 'google-calendar',
        name: 'Google Calendar',
        description: 'Sync class schedules, parent meetings, and school events automatically.',
        icon: <Calendar className="w-6 h-6" />,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        url: 'calendar.google.com',
        category: 'scheduling',
        enabled: false,
        configFields: ['clientId', 'clientSecret'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'zoom',
        name: 'Zoom',
        description: 'Schedule and manage virtual classes and parent-teacher conferences.',
        icon: <Video className="w-6 h-6" />,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        url: 'zoom.us',
        category: 'scheduling',
        enabled: false,
        configFields: ['apiKey', 'clientId', 'clientSecret'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'google-meet',
        name: 'Google Meet',
        description: 'Integrate with Google Meet for seamless video conferencing for classes.',
        icon: <Video className="w-6 h-6" />,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        url: 'meet.google.com',
        category: 'scheduling',
        enabled: false,
        configFields: ['clientId', 'clientSecret'],
        connectionStatus: 'disconnected',
    },

    // Storage & Files
    {
        id: 'google-drive',
        name: 'Google Drive',
        description: 'Store lesson plans, worksheets, and student submissions in Google Drive.',
        icon: <FolderOpen className="w-6 h-6" />,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        url: 'drive.google.com',
        category: 'storage',
        enabled: false,
        configFields: ['clientId', 'clientSecret'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'onedrive',
        name: 'Microsoft OneDrive',
        description: 'Access and share educational resources through OneDrive for Education.',
        icon: <FolderOpen className="w-6 h-6" />,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        url: 'onedrive.live.com',
        category: 'storage',
        enabled: false,
        configFields: ['clientId', 'clientSecret'],
        connectionStatus: 'disconnected',
    },

    // Analytics
    {
        id: 'power-bi',
        name: 'Power BI',
        description: 'Visualize student performance data and generate insightful reports.',
        icon: <BarChart3 className="w-6 h-6" />,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        url: 'powerbi.microsoft.com',
        category: 'analytics',
        enabled: false,
        configFields: ['apiKey', 'clientId'],
        connectionStatus: 'disconnected',
    },
    {
        id: 'google-sheets',
        name: 'Google Sheets',
        description: 'Export attendance, grades, and reports to Google Sheets automatically.',
        icon: <FileText className="w-6 h-6" />,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        url: 'sheets.google.com',
        category: 'analytics',
        enabled: false,
        configFields: ['clientId', 'clientSecret'],
        connectionStatus: 'disconnected',
    },

    // AI Tools
    {
        id: 'openai',
        name: 'ChatGPT / OpenAI',
        description: 'Use AI to generate lesson plans, grade essays, and create study materials.',
        icon: <Brain className="w-6 h-6" />,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        url: 'openai.com',
        category: 'ai',
        enabled: false,
        popular: true,
        configFields: ['apiKey'],
        connectionStatus: 'disconnected',
    },
]

type Tab = 'all' | 'lms' | 'communication' | 'grading' | 'scheduling' | 'storage' | 'analytics' | 'ai' | 'custom'

const tabLabels: Record<Tab, string> = {
    all: 'All Integrations',
    lms: 'LMS Platforms',
    communication: 'Communication',
    grading: 'Grading & Assessment',
    scheduling: 'Scheduling',
    storage: 'Storage & Files',
    analytics: 'Analytics & Reporting',
    ai: 'AI Tools',
    custom: 'Custom',
}

const fieldLabels: Record<string, string> = {
    apiKey: 'API Key',
    webhookUrl: 'Webhook URL',
    clientId: 'Client ID',
    clientSecret: 'Client Secret',
    phoneNumber: 'Phone Number',
    email: 'Email Address',
    customField1: 'Instance URL',
    customField2: 'Additional Config',
}

const STORAGE_KEY = 'eduflow_integrations'

export default function IntegrationPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<Tab>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [integrations, setIntegrations] = useState<Integration[]>(defaultIntegrations)
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
    const [showConfigModal, setShowConfigModal] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [configForm, setConfigForm] = useState<IntegrationConfig>({})
    const [isTesting, setIsTesting] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [newIntegration, setNewIntegration] = useState({
        name: '',
        description: '',
        url: '',
        webhookUrl: '',
    })
    const { toast } = useToast()

    // Load integrations from DB + localStorage on mount
    useEffect(() => {
        const loadIntegrations = async () => {
            setIsLoading(true)

            // 1. Fetch from Database
            let dbIntegrations: any[] = []
            try {
                const response = await fetch('/api/integrations')
                if (response.ok) {
                    const data = await response.json()
                    dbIntegrations = data.integrations || []
                }
            } catch (error) {
                console.log('Using local storage')
            }

            // 2. Fetch from LocalStorage
            let localIntegrations: any[] = []
            try {
                const saved = localStorage.getItem(STORAGE_KEY)
                if (saved) {
                    localIntegrations = JSON.parse(saved)
                }
            } catch (e) {
                console.error('Error loading from localStorage:', e)
            }

            // 3. Check WhatsApp Web Status specifically
            let isWhatsAppConnected = false;
            try {
                const waResponse = await fetch('/api/whatsapp-web');
                const waData = await waResponse.json();
                isWhatsAppConnected = waData.connected;
            } catch (e) {
                console.error('Failed to check WhatsApp status', e);
            }

            // 4. Merge Logic
            const merged = defaultIntegrations.map(defaultInt => {
                // Special handling for WhatsApp Web
                if (defaultInt.id === 'whatsapp-web') {
                    return {
                        ...defaultInt,
                        enabled: isWhatsAppConnected,
                        connectionStatus: isWhatsAppConnected ? 'connected' : 'disconnected',
                        getLastTested: isWhatsAppConnected ? new Date().toISOString() : undefined
                    } as Integration;
                }

                // Check if saved in DB
                const dbInt = dbIntegrations.find((d: any) => d.type === defaultInt.id)
                if (dbInt) {
                    return {
                        ...defaultInt,
                        enabled: true,
                        config: dbInt.meta?.config || {},
                        connectionStatus: 'connected' as const,
                        lastTested: dbInt.updatedAt,
                    }
                }

                // Check if saved locally
                const localInt = localIntegrations.find((l: any) => l.id === defaultInt.id)
                if (localInt?.config && Object.keys(localInt.config).some(k => localInt.config[k])) {
                    return {
                        ...defaultInt,
                        enabled: localInt.enabled || false,
                        config: localInt.config,
                        connectionStatus: localInt.enabled ? 'connected' as const : 'disconnected' as const,
                        lastTested: localInt.lastTested,
                    }
                }

                return defaultInt
            })

            // Add custom integrations from localStorage
            const customInts = localIntegrations.filter((l: any) => l.category === 'custom')
            const customWithIcons = customInts.map((c: any) => ({
                ...c,
                icon: <Globe className="w-6 h-6" />,
            }))

            setIntegrations([...merged, ...customWithIcons])
            setIsLoading(false)
        }

        loadIntegrations()
    }, [])

    // Save to localStorage
    const saveToLocalStorage = useCallback((updatedIntegrations: Integration[]) => {
        const toSave = updatedIntegrations.map(({ icon, ...rest }) => rest)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    }, [])

    // Save to database
    const saveToDatabase = async (integration: Integration, config: IntegrationConfig): Promise<boolean> => {
        try {
            const response = await fetch('/api/integrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: integration.id,
                    credentials: config,
                    meta: { config, name: integration.name }
                })
            })
            return response.ok
        } catch (error) {
            console.error('Failed to save:', error)
            return false
        }
    }

    // Delete from database
    const deleteFromDatabase = async (integrationId: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/integrations?type=${integrationId}`, {
                method: 'DELETE'
            })
            return response.ok
        } catch (error) {
            console.error('Failed to delete:', error)
            return false
        }
    }

    // Test integration connection
    const testConnection = async (integration: Integration, config: IntegrationConfig): Promise<{ success: boolean; message: string }> => {
        try {
            const hasConfig = Object.keys(config).some(k => config[k as keyof IntegrationConfig])

            if (!hasConfig) {
                return {
                    success: false,
                    message: 'Please enter your credentials to connect.',
                }
            }

            // For webhooks, test with a real request
            if (config.webhookUrl && (integration.id === 'discord' || integration.id === 'slack')) {
                const testEndpoint = `/api/integrations/${integration.id}/test`
                const response = await fetch(testEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ webhookUrl: config.webhookUrl })
                })
                const data = await response.json()
                return {
                    success: data.success || data.configured,
                    message: data.message || data.error || 'Connection test completed',
                }
            }

            // For other integrations, validate config exists
            return {
                success: true,
                message: 'Configuration saved successfully',
            }
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Connection test failed',
            }
        }
    }

    // Toggle integration
    const toggleIntegration = async (id: string) => {
        const integration = integrations.find(i => i.id === id)
        if (!integration) return

        // If trying to enable but no config, open config modal
        if (!integration.enabled) {
            const hasConfig = integration.config && Object.keys(integration.config).some(k => integration.config?.[k as keyof IntegrationConfig])

            if (!hasConfig) {
                openConfigModal(integration)
                return
            }
        }

        // Toggle the integration
        const updated = integrations.map(i =>
            i.id === id
                ? {
                    ...i,
                    enabled: !i.enabled,
                    connectionStatus: !i.enabled ? 'connected' as const : 'disconnected' as const
                }
                : i
        )
        setIntegrations(updated)
        saveToLocalStorage(updated)

        toast({
            title: integration.enabled ? 'Integration Disabled' : 'Integration Enabled',
            description: `${integration.name} has been ${integration.enabled ? 'disabled' : 'enabled'}.`,
        })
    }

    const openConfigModal = (integration: Integration) => {
        if (integration.id === 'whatsapp-web') {
            router.push('/dashboard/integration/whatsapp-web')
            return
        }
        setSelectedIntegration(integration)
        setConfigForm(integration.config || {})
        setShowConfigModal(true)
    }

    const saveConfig = async () => {
        if (!selectedIntegration) return

        setIsSaving(true)

        const hasConfig = Object.keys(configForm).some(k => configForm[k as keyof IntegrationConfig])

        // Test the connection
        const connectionResult = await testConnection(selectedIntegration, configForm)

        // Save to database
        if (hasConfig && connectionResult.success) {
            await saveToDatabase(selectedIntegration, configForm)
        }

        const updatedIntegrations = integrations.map(integration =>
            integration.id === selectedIntegration.id
                ? {
                    ...integration,
                    config: configForm,
                    enabled: hasConfig && connectionResult.success,
                    connectionStatus: connectionResult.success ? 'connected' as const : (hasConfig ? 'error' as const : 'disconnected' as const),
                    lastTested: new Date().toISOString(),
                    errorMessage: !connectionResult.success ? connectionResult.message : undefined,
                }
                : integration
        )

        setIntegrations(updatedIntegrations)
        saveToLocalStorage(updatedIntegrations)

        setIsSaving(false)

        if (connectionResult.success) {
            toast({
                title: 'Connected Successfully',
                description: `${selectedIntegration.name} is now active and ready to use.`,
            })
        } else {
            toast({
                title: 'Connection Failed',
                description: connectionResult.message,
                variant: 'destructive',
            })
        }

        setShowConfigModal(false)
        setSelectedIntegration(null)
        setConfigForm({})
    }

    const testSelectedConnection = async () => {
        if (!selectedIntegration) return

        setIsTesting(true)
        const result = await testConnection(selectedIntegration, configForm)
        setIsTesting(false)

        toast({
            title: result.success ? 'Connection Successful' : 'Connection Failed',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        })
    }

    const disconnectIntegration = async (id: string) => {
        // Delete from database
        await deleteFromDatabase(id)

        const updated = integrations.map(i =>
            i.id === id
                ? {
                    ...i,
                    enabled: false,
                    config: undefined,
                    connectionStatus: 'disconnected' as const,
                    errorMessage: undefined,
                }
                : i
        )
        setIntegrations(updated)
        saveToLocalStorage(updated)

        toast({
            title: 'Disconnected',
            description: 'Integration has been disconnected.',
        })

        setShowConfigModal(false)
        setSelectedIntegration(null)
    }

    const deleteIntegration = async (id: string) => {
        await disconnectIntegration(id)
        const updated = integrations.filter(integration => integration.id !== id)
        setIntegrations(updated)
        saveToLocalStorage(updated)
        toast({
            title: 'Integration Removed',
            description: 'The custom integration has been removed.',
        })
    }

    const addCustomIntegration = async () => {
        if (!newIntegration.name || !newIntegration.webhookUrl) {
            toast({
                title: 'Missing Fields',
                description: 'Please fill in the name and webhook URL.',
                variant: 'destructive',
            })
            return
        }

        setIsTesting(true)

        const custom: Integration = {
            id: `custom-${Date.now()}`,
            name: newIntegration.name,
            description: newIntegration.description || 'Custom webhook integration',
            icon: <Globe className="w-6 h-6" />,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
            url: newIntegration.url || 'custom',
            category: 'custom',
            enabled: true,
            configFields: ['webhookUrl'],
            config: { webhookUrl: newIntegration.webhookUrl },
            connectionStatus: 'connected',
            lastTested: new Date().toISOString(),
        }

        const updated = [...integrations, custom]
        setIntegrations(updated)
        saveToLocalStorage(updated)

        setIsTesting(false)
        setShowAddModal(false)
        setNewIntegration({ name: '', description: '', url: '', webhookUrl: '' })

        toast({
            title: 'Integration Added',
            description: `${custom.name} has been added successfully.`,
        })
    }

    const exportConfig = () => {
        const configData = {
            exportDate: new Date().toISOString(),
            integrations: integrations
                .filter(i => i.enabled)
                .map(({ id, name, enabled, category }) => ({
                    id,
                    name,
                    enabled,
                    category,
                })),
        }

        const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `integrations-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
            title: 'Exported',
            description: 'Integration list has been downloaded.',
        })
    }

    const getConnectionStatusIcon = (integration: Integration) => {
        if (integration.connectionStatus === 'testing') {
            return <Loader2 className="w-4 h-4 animate-spin text-primary" />
        }
        if (integration.enabled && integration.connectionStatus === 'connected') {
            return <CheckCircle2 className="w-4 h-4 text-green-500" />
        }
        if (integration.connectionStatus === 'error') {
            return <XCircle className="w-4 h-4 text-red-500" />
        }
        return null
    }

    const getConnectionStatusText = (integration: Integration) => {
        if (integration.connectionStatus === 'testing') return 'Testing...'
        if (integration.enabled && integration.connectionStatus === 'connected') return 'Connected'
        if (integration.connectionStatus === 'error') return 'Error'
        return 'Not connected'
    }

    const filteredIntegrations = integrations.filter(integration => {
        const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            integration.description.toLowerCase().includes(searchQuery.toLowerCase())

        if (activeTab === 'all') return matchesSearch
        return matchesSearch && integration.category === activeTab
    })

    const activeCount = integrations.filter(i => i.enabled && i.connectionStatus === 'connected').length
    const totalCount = integrations.length
    const customCount = integrations.filter(i => i.category === 'custom').length
    const popularIntegrations = integrations.filter(i => i.popular)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Zap className="w-7 h-7 text-primary" />
                        Integrations
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Connect your favorite tools to automate your teaching workflow.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportConfig}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button size="sm" onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 dark:from-green-950/20 dark:to-green-900/10 dark:border-green-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                                <Link2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{activeCount}</p>
                                <p className="text-sm text-green-600 dark:text-green-500">Connected</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalCount}</p>
                                <p className="text-sm text-blue-600 dark:text-blue-500">Available</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 dark:from-purple-950/20 dark:to-purple-900/10 dark:border-purple-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{customCount}</p>
                                <p className="text-sm text-purple-600 dark:text-purple-500">Custom</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200 dark:from-orange-950/20 dark:to-orange-900/10 dark:border-orange-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">6</p>
                                <p className="text-sm text-orange-600 dark:text-orange-500">Categories</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Popular Integrations */}
            <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    ⭐ Popular for Educators
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {popularIntegrations.map((integration) => (
                        <Card
                            key={integration.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${integration.enabled && integration.connectionStatus === 'connected'
                                ? 'ring-2 ring-green-500 ring-offset-2'
                                : ''
                                }`}
                            onClick={() => openConfigModal(integration)}
                        >
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl ${integration.iconBg} ${integration.iconColor} flex items-center justify-center`}>
                                    {integration.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{integration.name}</h3>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        {getConnectionStatusIcon(integration)}
                                        <span>{getConnectionStatusText(integration)}</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Tabs and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
                    {(Object.keys(tabLabels) as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === tab
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tabLabels[tab]}
                            {tab === 'custom' && customCount > 0 && (
                                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                                    {customCount}
                                </Badge>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search integrations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Integration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIntegrations.map((integration) => (
                    <Card key={integration.id} className="group hover:shadow-md transition-all">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-12 h-12 rounded-xl ${integration.iconBg} ${integration.iconColor} flex items-center justify-center`}>
                                    {integration.icon}
                                </div>
                                <div className="flex items-center gap-2">
                                    {integration.popular && (
                                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                                    )}
                                    {integration.category === 'custom' && (
                                        <Badge variant="outline" className="text-xs">Custom</Badge>
                                    )}
                                    {integration.enabled && integration.connectionStatus === 'connected' && (
                                        <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            Connected
                                        </Badge>
                                    )}
                                    {integration.connectionStatus === 'error' && (
                                        <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                            Error
                                        </Badge>
                                    )}
                                    <a
                                        href={`https://${integration.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>

                            <h3 className="font-semibold text-lg mb-1">{integration.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {integration.description}
                            </p>

                            {integration.errorMessage && (
                                <div className="text-xs text-red-500 mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                    {integration.errorMessage}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openConfigModal(integration)}
                                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Configure
                                    </button>
                                    {integration.category === 'custom' && (
                                        <button
                                            onClick={() => deleteIntegration(integration.id)}
                                            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1.5 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Toggle Switch */}
                                <button
                                    onClick={() => toggleIntegration(integration.id)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${integration.enabled && integration.connectionStatus === 'connected'
                                        ? 'bg-green-500'
                                        : integration.connectionStatus === 'error'
                                            ? 'bg-red-400'
                                            : 'bg-muted'
                                        }`}
                                    title={integration.enabled ? 'Click to disable' : 'Click to configure'}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${integration.enabled
                                            ? 'translate-x-5'
                                            : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {filteredIntegrations.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">No integrations found</h3>
                    <p className="text-muted-foreground mb-4">
                        Try adjusting your search or filter.
                    </p>
                    {activeTab === 'custom' && (
                        <Button onClick={() => setShowAddModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Custom Integration
                        </Button>
                    )}
                </div>
            )}

            {/* Configuration Modal */}
            {showConfigModal && selectedIntegration && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${selectedIntegration.iconBg} ${selectedIntegration.iconColor} flex items-center justify-center`}>
                                    {selectedIntegration.icon}
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {selectedIntegration.name}
                                        {selectedIntegration.enabled && selectedIntegration.connectionStatus === 'connected' && (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        )}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">Enter your credentials to connect</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowConfigModal(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Config Fields */}
                            {selectedIntegration.configFields.map((field) => (
                                <div key={field} className="space-y-2">
                                    <Label htmlFor={field}>{fieldLabels[field] || field}</Label>
                                    <Input
                                        id={field}
                                        type={field.toLowerCase().includes('secret') || field.toLowerCase().includes('key') || field.toLowerCase().includes('pass') ? 'password' : 'text'}
                                        placeholder={`Enter ${fieldLabels[field] || field}`}
                                        value={configForm[field as keyof IntegrationConfig] || ''}
                                        onChange={(e) => setConfigForm(prev => ({ ...prev, [field]: e.target.value }))}
                                    />
                                </div>
                            ))}

                            {selectedIntegration.configFields.length === 0 && (
                                <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted rounded-lg">
                                    <AlertCircle className="w-5 h-5" />
                                    <p className="text-sm">This integration doesn&apos;t require additional configuration.</p>
                                </div>
                            )}

                            {selectedIntegration.lastTested && (
                                <p className="text-xs text-muted-foreground">
                                    Last connected: {new Date(selectedIntegration.lastTested).toLocaleString()}
                                </p>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={testSelectedConnection}
                                    disabled={isTesting || isSaving}
                                    className="flex-1"
                                >
                                    {isTesting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                    )}
                                    Test
                                </Button>
                                <Button
                                    onClick={saveConfig}
                                    disabled={isTesting || isSaving}
                                    className="flex-1"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Connect
                                </Button>
                            </div>

                            {selectedIntegration.enabled && (
                                <Button
                                    variant="outline"
                                    onClick={() => disconnectIntegration(selectedIntegration.id)}
                                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <Unlink className="w-4 h-4 mr-2" />
                                    Disconnect
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Add Custom Integration Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Add Custom Integration</CardTitle>
                                <p className="text-sm text-muted-foreground">Connect any service using webhooks</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Integration Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., School SIS"
                                    value={newIntegration.name}
                                    onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="What does this integration do?"
                                    value={newIntegration.description}
                                    onChange={(e) => setNewIntegration(prev => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url">Website URL</Label>
                                <Input
                                    id="url"
                                    placeholder="e.g., school-sis.com"
                                    value={newIntegration.url}
                                    onChange={(e) => setNewIntegration(prev => ({ ...prev, url: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="webhookUrl">Webhook URL *</Label>
                                <Input
                                    id="webhookUrl"
                                    placeholder="https://..."
                                    value={newIntegration.webhookUrl}
                                    onChange={(e) => setNewIntegration(prev => ({ ...prev, webhookUrl: e.target.value }))}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={addCustomIntegration} disabled={isTesting}>
                                    {isTesting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4 mr-2" />
                                    )}
                                    Add Integration
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Help Section */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-lg mb-1">Need Help?</h3>
                            <p className="text-muted-foreground">
                                Check our documentation for step-by-step guides on connecting your favorite tools.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline">View Documentation</Button>
                            <Button>Contact Support</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}