'use client'

import { useState } from 'react'
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
    Check,
    AlertCircle,
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
        enabled: true,
        popular: true,
        configFields: ['clientId', 'clientSecret'],
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
        enabled: true,
        popular: true,
        configFields: ['apiKey', 'customField1'],
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
    },

    // Communication
    {
        id: 'whatsapp',
        name: 'WhatsApp for Parents',
        description: 'Send automated attendance alerts and progress updates to parents via WhatsApp.',
        icon: <Phone className="w-6 h-6" />,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        url: 'whatsapp.com',
        category: 'communication',
        enabled: true,
        popular: true,
        configFields: ['phoneNumber', 'apiKey'],
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
        enabled: true,
        configFields: ['email', 'clientId', 'clientSecret'],
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
        enabled: true,
        configFields: ['clientId', 'clientSecret'],
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
        enabled: true,
        configFields: ['apiKey', 'clientId', 'clientSecret'],
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
        enabled: true,
        configFields: ['clientId', 'clientSecret'],
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
        enabled: true,
        configFields: ['clientId', 'clientSecret'],
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
        enabled: true,
        popular: true,
        configFields: ['apiKey'],
    },
]

type Tab = 'all' | 'lms' | 'communication' | 'grading' | 'scheduling' | 'storage' | 'custom'

const tabLabels: Record<Tab, string> = {
    all: 'All Integrations',
    lms: 'LMS Platforms',
    communication: 'Communication',
    grading: 'Grading & Assessment',
    scheduling: 'Scheduling',
    storage: 'Storage & Files',
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

export default function IntegrationPage() {
    const [activeTab, setActiveTab] = useState<Tab>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [integrations, setIntegrations] = useState<Integration[]>(defaultIntegrations)
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
    const [showConfigModal, setShowConfigModal] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [configForm, setConfigForm] = useState<IntegrationConfig>({})
    const [newIntegration, setNewIntegration] = useState({
        name: '',
        description: '',
        url: '',
        webhookUrl: '',
    })
    const { toast } = useToast()

    const toggleIntegration = (id: string) => {
        setIntegrations(prev => prev.map(integration => 
            integration.id === id 
                ? { ...integration, enabled: !integration.enabled }
                : integration
        ))
    }

    const openConfigModal = (integration: Integration) => {
        setSelectedIntegration(integration)
        setConfigForm(integration.config || {})
        setShowConfigModal(true)
    }

    const saveConfig = () => {
        if (!selectedIntegration) return

        setIntegrations(prev => prev.map(integration => 
            integration.id === selectedIntegration.id 
                ? { ...integration, config: configForm, enabled: true }
                : integration
        ))

        toast({
            title: 'Configuration Saved',
            description: `${selectedIntegration.name} has been configured successfully.`,
        })

        setShowConfigModal(false)
        setSelectedIntegration(null)
        setConfigForm({})
    }

    const deleteIntegration = (id: string) => {
        setIntegrations(prev => prev.filter(integration => integration.id !== id))
        toast({
            title: 'Integration Removed',
            description: 'The custom integration has been removed.',
        })
    }

    const addCustomIntegration = () => {
        if (!newIntegration.name || !newIntegration.webhookUrl) {
            toast({
                title: 'Missing Fields',
                description: 'Please fill in the name and webhook URL.',
                variant: 'destructive',
            })
            return
        }

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
        }

        setIntegrations(prev => [...prev, custom])
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
            integrations: integrations.map(({ id, name, enabled, config, category }) => ({
                id,
                name,
                enabled,
                category,
                config: config || {},
            })),
        }

        const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `eduflow-integrations-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
            title: 'Export Complete',
            description: 'Integration configuration has been downloaded.',
        })
    }

    const filteredIntegrations = integrations.filter(integration => {
        const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            integration.description.toLowerCase().includes(searchQuery.toLowerCase())
        
        if (activeTab === 'all') return matchesSearch
        return matchesSearch && integration.category === activeTab
    })

    const activeCount = integrations.filter(i => i.enabled).length
    const popularIntegrations = integrations.filter(i => i.popular)
    const customCount = integrations.filter(i => i.category === 'custom').length

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <GraduationCap className="w-7 h-7 text-primary" />
                        Educational Integrations
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Connect your favorite educational tools to automate attendance, grading, and parent communication.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportConfig}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Config
                    </Button>
                    <Button size="sm" onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                                <Check className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700">{activeCount}</p>
                                <p className="text-sm text-green-600">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-700">{integrations.filter(i => i.category === 'lms').length}</p>
                                <p className="text-sm text-blue-600">LMS</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-700">{customCount}</p>
                                <p className="text-sm text-purple-600">Custom</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-orange-700">{integrations.filter(i => i.config && Object.keys(i.config).length > 0).length}</p>
                                <p className="text-sm text-orange-600">Configured</p>
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
                            className={`cursor-pointer transition-all hover:shadow-md ${
                                integration.enabled 
                                    ? 'ring-2 ring-primary ring-offset-2' 
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
                                    <p className="text-xs text-muted-foreground">
                                        {integration.enabled ? '✓ Connected' : 'Click to configure'}
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
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                                activeTab === tab 
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
                                    {integration.config && Object.keys(integration.config).length > 0 && (
                                        <Badge className="text-xs bg-green-100 text-green-700">Configured</Badge>
                                    )}
                                    <a 
                                        href={`https://${integration.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>

                            <h3 className="font-semibold text-lg mb-1">{integration.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {integration.description}
                            </p>

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
                                    className={`relative w-11 h-6 rounded-full transition-colors ${
                                        integration.enabled 
                                            ? 'bg-green-500' 
                                            : 'bg-muted'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                                            integration.enabled 
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
                    <Card className="w-full max-w-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${selectedIntegration.iconBg} ${selectedIntegration.iconColor} flex items-center justify-center`}>
                                    {selectedIntegration.icon}
                                </div>
                                <div>
                                    <CardTitle>{selectedIntegration.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">Configure integration settings</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowConfigModal(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedIntegration.configFields.map((field) => (
                                <div key={field} className="space-y-2">
                                    <Label htmlFor={field}>{fieldLabels[field] || field}</Label>
                                    <Input
                                        id={field}
                                        type={field.toLowerCase().includes('secret') || field.toLowerCase().includes('key') ? 'password' : 'text'}
                                        placeholder={`Enter ${fieldLabels[field] || field}`}
                                        value={configForm[field as keyof IntegrationConfig] || ''}
                                        onChange={(e) => setConfigForm(prev => ({ ...prev, [field]: e.target.value }))}
                                    />
                                </div>
                            ))}

                            {selectedIntegration.configFields.length === 0 && (
                                <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted rounded-lg">
                                    <AlertCircle className="w-5 h-5" />
                                    <p className="text-sm">This integration uses environment variables for configuration.</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={saveConfig}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Configuration
                                </Button>
                            </div>
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
                                <p className="text-xs text-muted-foreground">
                                    The URL that will receive data from your workflows
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={addCustomIntegration}>
                                    <Plus className="w-4 h-4 mr-2" />
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
                            <h3 className="font-semibold text-lg mb-1">Need help setting up integrations?</h3>
                            <p className="text-muted-foreground">
                                Check our documentation for step-by-step guides on connecting your school tools.
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