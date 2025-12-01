 
'use client'

import { useState,  } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import {
    Phone,
    Mail,
    Slack,
    MessageCircle,
    Send,
    Info,
} from 'lucide-react'

export default function IntegrationPage() {
    const [testingSMS, setTestingSMS] = useState(false)
    const [testingEmail, setTestingEmail] = useState(false)
    const [testingSlack, setTestingSlack] = useState(false)
    const [testingDiscord, setTestingDiscord] = useState(false)
    const [testingWhatsApp, setTestingWhatsApp] = useState(false)
    const { toast } = useToast()

    // WhatsApp Config
    const [whatsappConfig, setWhatsappConfig] = useState({
        phoneNumber: '',
    })

    // SMS Config
    const [smsConfig, setSmsConfig] = useState({
        phoneNumber: '',
        message: 'Test SMS from FlowX'
    })

    // Email Config
    const [emailConfig, setEmailConfig] = useState({
        to: '',
        subject: 'Test Email from FlowX',
        message: 'This is a test email from FlowX Integration Page.'
    })

    // Slack Config
    const [slackConfig, setSlackConfig] = useState({
        webhookUrl: '',
        message: 'Test message from FlowX'
    })

    // Discord Config
    const [discordConfig, setDiscordConfig] = useState({
        webhookUrl: '',
        message: 'Test message from FlowX'
    })

    // WhatsApp Test
    const handleTestWhatsApp = async () => {
        if (!whatsappConfig.phoneNumber.trim()) {
            toast({
                title: 'No Phone Number',
                description: 'Please enter a phone number',
                variant: 'destructive',
            })
            return
        }

        try {
            setTestingWhatsApp(true)

            const response = await fetch('/api/integrations/whatsapp/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: whatsappConfig.phoneNumber,
                    message: 'This is a test WhatsApp message from FlowX!'
                })
            })

            const data = await response.json()

            if (data.ok) {
                toast({
                    title: data.simulated ? 'Test Simulated ✓' : 'Message Sent ✓',
                    description: data.simulated
                        ? data.data.note || 'WhatsApp simulated (configure Twilio credentials)'
                        : `Message sent successfully! SID: ${data.data.sid}`,
                })
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            console.error('WhatsApp test failed:', error)
            toast({
                title: 'Test Failed',
                description: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
                variant: 'destructive',
            })
        } finally {
            setTestingWhatsApp(false)
        }
    }

    // SMS Test
    const handleTestSMS = async () => {
        if (!smsConfig.phoneNumber.trim()) {
            toast({
                title: 'No Phone Number',
                description: 'Please enter a phone number',
                variant: 'destructive',
            })
            return
        }

        try {
            setTestingSMS(true)

            const response = await fetch('/api/integrations/sms/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: smsConfig.phoneNumber,
                    message: smsConfig.message
                })
            })

            const data = await response.json()

            if (data.ok) {
                toast({
                    title: data.simulated ? 'Test Simulated ✓' : 'SMS Sent ✓',
                    description: data.simulated
                        ? data.data.note || 'SMS simulated (configure Twilio credentials)'
                        : `SMS sent successfully! SID: ${data.data.sid}`,
                })
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            console.error('SMS test failed:', error)
            toast({
                title: 'Test Failed',
                description: error instanceof Error ? error.message : 'Failed to send SMS',
                variant: 'destructive',
            })
        } finally {
            setTestingSMS(false)
        }
    }

    // Email Test
    const handleTestEmail = async () => {
        if (!emailConfig.to.trim()) {
            toast({
                title: 'No Recipient',
                description: 'Please enter an email address',
                variant: 'destructive',
            })
            return
        }

        try {
            setTestingEmail(true)

            const response = await fetch('/api/integrations/email/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: emailConfig.to,
                    subject: emailConfig.subject,
                    message: emailConfig.message
                })
            })

            const data = await response.json()

            if (data.ok) {
                toast({
                    title: data.simulated ? 'Test Simulated ✓' : 'Email Sent ✓',
                    description: data.simulated
                        ? 'Email simulated (configure SMTP credentials)'
                        : `Email sent successfully! Message ID: ${data.data.messageId}`,
                })
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            console.error('Email test failed:', error)
            toast({
                title: 'Test Failed',
                description: error instanceof Error ? error.message : 'Failed to send email',
                variant: 'destructive',
            })
        } finally {
            setTestingEmail(false)
        }
    }

    // Slack Test
    const handleTestSlack = async () => {
        try {
            setTestingSlack(true)

            const response = await fetch('/api/integrations/slack/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    webhookUrl: slackConfig.webhookUrl || undefined,
                    message: slackConfig.message
                })
            })

            const data = await response.json()

            if (data.ok) {
                toast({
                    title: 'Slack Message Sent ✓',
                    description: `Message posted to Slack successfully! (${data.data.webhookUsed} webhook)`,
                })
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            console.error('Slack test failed:', error)
            toast({
                title: 'Test Failed',
                description: error instanceof Error ? error.message : 'Failed to send Slack message',
                variant: 'destructive',
            })
        } finally {
            setTestingSlack(false)
        }
    }

    // Discord Test
    const handleTestDiscord = async () => {
        try {
            setTestingDiscord(true)

            const response = await fetch('/api/integrations/discord/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    webhookUrl: discordConfig.webhookUrl || undefined,
                    message: discordConfig.message
                })
            })

            const data = await response.json()

            if (data.ok) {
                toast({
                    title: 'Discord Message Sent ✓',
                    description: `Message posted to Discord successfully! (${data.data.webhookUsed} webhook)`,
                })
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            console.error('Discord test failed:', error)
            toast({
                title: 'Test Failed',
                description: error instanceof Error ? error.message : 'Failed to send Discord message',
                variant: 'destructive',
            })
        } finally {
            setTestingDiscord(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* WhatsApp Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        <CardTitle>WhatsApp</CardTitle>
                    </div>
                    <CardDescription>Send test WhatsApp messages via Twilio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Configure <code className="text-xs bg-muted px-1 py-0.5 rounded">TWILIO_WHATSAPP_FROM</code> in your .env file
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label>Test Phone Number</Label>
                        <Input
                            placeholder="+919876543210"
                            value={whatsappConfig.phoneNumber}
                            onChange={(e) => setWhatsappConfig({ phoneNumber: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Include country code (e.g., +91 for India)
                        </p>
                    </div>
                    <Button onClick={handleTestWhatsApp} disabled={testingWhatsApp}>
                        <Send className="w-4 h-4 mr-2" />
                        {testingWhatsApp ? 'Sending...' : 'Send Test WhatsApp'}
                    </Button>
                </CardContent>
            </Card>

            {/* SMS Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        <CardTitle>SMS</CardTitle>
                    </div>
                    <CardDescription>Send test SMS messages via Twilio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Configure <code className="text-xs bg-muted px-1 py-0.5 rounded">TWILIO_PHONE_NUMBER</code> in your .env file
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                            placeholder="+1234567890"
                            value={smsConfig.phoneNumber}
                            onChange={(e) => setSmsConfig({ ...smsConfig, phoneNumber: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                            placeholder="Your test message"
                            value={smsConfig.message}
                            onChange={(e) => setSmsConfig({ ...smsConfig, message: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <Button onClick={handleTestSMS} disabled={testingSMS}>
                        <Send className="w-4 h-4 mr-2" />
                        {testingSMS ? 'Sending...' : 'Send Test SMS'}
                    </Button>
                </CardContent>
            </Card>

            {/* Email Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        <CardTitle>Email</CardTitle>
                    </div>
                    <CardDescription>Send test emails via SMTP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Configure SMTP settings in your .env file
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label>Recipient Email</Label>
                        <Input
                            type="email"
                            placeholder="test@example.com"
                            value={emailConfig.to}
                            onChange={(e) => setEmailConfig({ ...emailConfig, to: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                            placeholder="Email subject"
                            value={emailConfig.subject}
                            onChange={(e) => setEmailConfig({ ...emailConfig, subject: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                            placeholder="Your test message"
                            value={emailConfig.message}
                            onChange={(e) => setEmailConfig({ ...emailConfig, message: e.target.value })}
                            rows={4}
                        />
                    </div>
                    <Button onClick={handleTestEmail} disabled={testingEmail}>
                        <Send className="w-4 h-4 mr-2" />
                        {testingEmail ? 'Sending...' : 'Send Test Email'}
                    </Button>
                </CardContent>
            </Card>

            {/* Slack Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Slack className="w-5 h-5" />
                        <CardTitle>Slack</CardTitle>
                    </div>
                    <CardDescription>Send test messages to Slack</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Set <code className="text-xs bg-muted px-1 py-0.5 rounded">SLACK_WEBHOOK_URL</code> in .env or enter below
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label>Webhook URL (Optional)</Label>
                        <Input
                            placeholder="https://hooks.slack.com/services/... (or use env variable)"
                            value={slackConfig.webhookUrl}
                            onChange={(e) => setSlackConfig({ ...slackConfig, webhookUrl: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave blank to use SLACK_WEBHOOK_URL from environment
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                            placeholder="Your test message"
                            value={slackConfig.message}
                            onChange={(e) => setSlackConfig({ ...slackConfig, message: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <Button onClick={handleTestSlack} disabled={testingSlack}>
                        <Send className="w-4 h-4 mr-2" />
                        {testingSlack ? 'Sending...' : 'Send Test Message'}
                    </Button>
                </CardContent>
            </Card>

            {/* Discord Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        <CardTitle>Discord</CardTitle>
                    </div>
                    <CardDescription>Send test messages to Discord</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Set <code className="text-xs bg-muted px-1 py-0.5 rounded">DISCORD_WEBHOOK_URL</code> in .env or enter below
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label>Webhook URL (Optional)</Label>
                        <Input
                            placeholder="https://discord.com/api/webhooks/... (or use env variable)"
                            value={discordConfig.webhookUrl}
                            onChange={(e) => setDiscordConfig({ ...discordConfig, webhookUrl: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave blank to use DISCORD_WEBHOOK_URL from environment
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                            placeholder="Your test message"
                            value={discordConfig.message}
                            onChange={(e) => setDiscordConfig({ ...discordConfig, message: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <Button onClick={handleTestDiscord} disabled={testingDiscord}>
                        <Send className="w-4 h-4 mr-2" />
                        {testingDiscord ? 'Sending...' : 'Send Test Message'}
                    </Button>
                </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Usage Statistics</CardTitle>
                    <CardDescription>Integration usage over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold">247</p>
                            <p className="text-sm text-muted-foreground">WhatsApp</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold">156</p>
                            <p className="text-sm text-muted-foreground">Emails</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold">89</p>
                            <p className="text-sm text-muted-foreground">SMS</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold">45</p>
                            <p className="text-sm text-muted-foreground">Slack</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold">32</p>
                            <p className="text-sm text-muted-foreground">Discord</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}