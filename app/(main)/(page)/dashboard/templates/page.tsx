/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(main)/(page)/dashboard/templates/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Search,
    Clock,
    Calendar,
    Mail,
    MessageSquare,
    Bell,
    Users,
    GraduationCap,
    ClipboardCheck,
    FileText,
    BarChart3,
    Zap,
    Star,
    ArrowRight,
    CheckCircle2,
    BookOpen,
    Award,
    Send,
    Timer,
    Sparkles,
    TrendingUp,
    AlertCircle,
    Phone,
    Video,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Template Categories
const categories = [
    { id: "all", label: "All Templates", icon: Zap },
    { id: "communication", label: "Communication", icon: MessageSquare },
    { id: "attendance", label: "Attendance", icon: ClipboardCheck },
    { id: "grading", label: "Grading & Reports", icon: BarChart3 },
    { id: "scheduling", label: "Scheduling", icon: Calendar },
    { id: "assignments", label: "Assignments", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell },
];

// Comprehensive workflow templates for teachers
const templates = [
    // Communication Templates
    {
        id: "attendance-alert",
        name: "Low Attendance Alert",
        description: "Automatically notify parents when student attendance drops below threshold",
        category: "attendance",
        difficulty: "easy",
        popular: true,
        estimatedTime: "5 min",
        tags: ["attendance", "parents", "alert", "automated"],
        icon: AlertCircle,
        color: "from-red-500 to-orange-500",
        nodes: [
            {
                id: "attendance-check-1",
                type: "custom",
                position: { x: 100, y: 150 },
                data: {
                    label: "Check Attendance",
                    nodeType: "attendance-track",
                    config: { threshold: 75, action: "alert", classId: "" }
                }
            },
            {
                id: "condition-1",
                type: "custom",
                position: { x: 350, y: 150 },
                data: {
                    label: "Below Threshold?",
                    nodeType: "condition",
                    config: { field: "attendancePercent", operator: "lessThan", value: "75" }
                }
            },
            {
                id: "alert-1",
                type: "custom",
                position: { x: 600, y: 150 },
                data: {
                    label: "Send Alert",
                    nodeType: "alert-send",
                    config: {
                        channels: ["email", "whatsapp"],
                        title: "Attendance Alert",
                        message: "Your child's attendance has dropped below 75%. Please contact the school.",
                        recipients: "",
                        priority: "high"
                    }
                }
            }
        ],
        edges: [
            { id: "e1-2", source: "attendance-check-1", target: "condition-1", animated: true },
            { id: "e2-3", source: "condition-1", target: "alert-1", animated: true }
        ]
    },
    {
        id: "daily-attendance-summary",
        name: "Daily Attendance Summary",
        description: "Send daily attendance summary to class parents via WhatsApp/Email",
        category: "attendance",
        difficulty: "easy",
        popular: true,
        estimatedTime: "3 min",
        tags: ["daily", "summary", "parents", "automated"],
        icon: ClipboardCheck,
        color: "from-green-500 to-emerald-500",
        nodes: [
            {
                id: "attendance-track-1",
                type: "custom",
                position: { x: 100, y: 150 },
                data: {
                    label: "Get Today's Attendance",
                    nodeType: "attendance-track",
                    config: { threshold: 100, action: "summary", classId: "" }
                }
            },
            {
                id: "report-gen-1",
                type: "custom",
                position: { x: 350, y: 150 },
                data: {
                    label: "Generate Summary",
                    nodeType: "report-generate",
                    config: { reportType: "attendance", format: "text", includeCharts: false }
                }
            },
            {
                id: "whatsapp-1",
                type: "custom",
                position: { x: 600, y: 150 },
                data: {
                    label: "Send to Parents Group",
                    nodeType: "whatsapp-group",
                    config: {
                        groupName: "Class Parents",
                        message: "📊 *Daily Attendance Summary*\n\nDate: {{date}}\nPresent: {{present}}\nAbsent: {{absent}}\n\nAbsent students: {{absentList}}",
                        to: ""
                    }
                }
            }
        ],
        edges: [
            { id: "e1-2", source: "attendance-track-1", target: "report-gen-1", animated: true },
            { id: "e2-3", source: "report-gen-1", target: "whatsapp-1", animated: true }
        ]
    },
    {
        id: "assignment-reminder",
        name: "Assignment Deadline Reminder",
        description: "Send reminders to students before assignment deadlines",
        category: "assignments",
        difficulty: "easy",
        popular: true,
        estimatedTime: "4 min",
        tags: ["assignments", "reminder", "students", "deadline"],
        icon: FileText,
        color: "from-blue-500 to-indigo-500",
        nodes: [
            {
                id: "schedule-check-1",
                type: "custom",
                position: { x: 100, y: 150 },
                data: {
                    label: "Check Upcoming Deadlines",
                    nodeType: "schedule-check",
                    config: { reminderMinutes: 1440, date: "" } // 24 hours before
                }
            },
            {
                id: "assignment-1",
                type: "custom",
                position: { x: 350, y: 150 },
                data: {
                    label: "Get Assignment Details",
                    nodeType: "assignment-create",
                    config: { title: "", description: "", dueDate: "", points: 100 }
                }
            },
            {
                id: "alert-students-1",
                type: "custom",
                position: { x: 600, y: 150 },
                data: {
                    label: "Notify Students",
                    nodeType: "student-notify",
                    config: {
                        recipientType: "all",
                        message: "📚 *Assignment Reminder*\n\nDue: {{dueDate}}\nTitle: {{title}}\n\nDon't forget to submit on time!",
                        channels: ["email", "whatsapp"]
                    }
                }
            }
        ],
        edges: [
            { id: "e1-2", source: "schedule-check-1", target: "assignment-1", animated: true },
            { id: "e2-3", source: "assignment-1", target: "alert-students-1", animated: true }
        ]
    },
    {
        id: "exam-notification",
        name: "Exam Schedule Notification",
        description: "Notify students and parents about upcoming exams with venue details",
        category: "scheduling",
        difficulty: "medium",
        popular: true,
        estimatedTime: "6 min",
        tags: ["exam", "schedule", "notification", "parents"],
        icon: Calendar,
        color: "from-purple-500 to-pink-500",
        nodes: [
            {
                id: "schedule-1",
                type: "custom",
                position: { x: 100, y: 150 },
                data: {
                    label: "Get Exam Schedule",
                    nodeType: "schedule-check",
                    config: { reminderMinutes: 10080, date: "" } // 1 week before
                }
            },
            {
                id: "alert-1",
                type: "custom",
                position: { x: 400, y: 100 },
                data: {
                    label: "Notify Students",
                    nodeType: "alert-send",
                    config: {
                        channels: ["whatsapp", "email"],
                        title: "Exam Schedule",
                        message: "📝 *Exam Notice*\n\nSubject: {{subject}}\nDate: {{date}}\nTime: {{time}}\nVenue: {{venue}}\n\nAll the best!",
                        recipients: "",
                        priority: "high"
                    }
                }
            },
            {
                id: "alert-2",
                type: "custom",
                position: { x: 400, y: 220 },
                data: {
                    label: "Notify Parents",
                    nodeType: "alert-send",
                    config: {
                        channels: ["whatsapp", "email"],
                        title: "Exam Schedule - Parent Notification",
                        message: "📝 *Parent Exam Notice*\n\nYour child has an upcoming exam:\n\nSubject: {{subject}}\nDate: {{date}}\n\nPlease ensure they are prepared.",
                        recipients: "",
                        priority: "normal"
                    }
                }
            }
        ],
        edges: [
            { id: "e1-2", source: "schedule-1", target: "alert-1", animated: true },
            { id: "e1-3", source: "schedule-1", target: "alert-2", animated: true }
        ]
    },
    {
        id: "grade-report",
        name: "Automated Grade Report",
        description: "Calculate grades and send detailed report cards to parents",
        category: "grading",
        difficulty: "medium",
        popular: true,
        estimatedTime: "8 min",
        tags: ["grades", "report", "parents", "calculation"],
        icon: Award,
        color: "from-yellow-500 to-amber-500",
        nodes: [
            {
                id: "grade-calc-1",
                type: "custom",
                position: { x: 100, y: 150 },
                data: {
                    label: "Calculate Grades",
                    nodeType: "grade-calculate",
                    config: {
                        formula: "weighted",
                        weights: { assignments: 30, quizzes: 30, exams: 40 }
                    }
                }
            },
            {
                id: "report-1",
                type: "custom",
                position: { x: 350, y: 150 },
                data: {
                    label: "Generate Report Card",
                    nodeType: "report-generate",
                    config: { reportType: "grades", format: "pdf", includeCharts: true }
                }
            },
            {
                id: "email-1",
                type: "custom",
                position: { x: 600, y: 150 },
                data: {
                    label: "Email to Parents",
                    nodeType: "email-send",
                    config: {
                        to: "",
                        subject: "Student Report Card - {{studentName}}",
                        body: "Dear Parent,\n\nPlease find attached the report card for {{studentName}}.\n\nOverall Grade: {{grade}}\n\nBest regards,\nSchool Administration"
                    }
                }
            }
        ],
        edges: [
            { id: "e1-2", source: "grade-calc-1", target: "report-1", animated: true },
            { id: "e2-3", source: "report-1", target: "email-1", animated: true }
        ]
    },
    {
        id: "class-announcement",
        name: "Multi-Channel Class Announcement",
        description: "Send announcements to students via WhatsApp, Email, and Slack simultaneously",
        category: "communication",
        difficulty: "easy",
        popular: true,
        estimatedTime: "3 min",
        tags: ["announcement", "multi-channel", "class"],
        icon: Bell,
        color: "from-cyan-500 to-teal-500",
        nodes: [
            {
                id: "alert-multi-1",
                type: "custom",
                position: { x: 250, y: 150 },
                data: {
                    label: "Send Announcement",
                    nodeType: "alert-send",
                    config: {
                        channels: ["whatsapp", "email", "slack"],
                        title: "Class Announcement",
                        message: "📢 *Important Announcement*\n\n{{message}}\n\n- Your Teacher",
                        recipients: "",
                        priority: "normal"
                    }
                }
            }
        ],
        edges: []
    },
    {
        id: "quiz-results",
        name: "Quiz Results Notification",
        description: "Automatically send quiz scores to students and parents after grading",
        category: "grading",
        difficulty: "medium",
        estimatedTime: "5 min",
        tags: ["quiz", "results", "grades", "notification"],
        icon: CheckCircle2,
        color: "from-green-500 to-lime-500",
        nodes: [
            {
                id: "quiz-1",
                type: "custom",
                position: { x: 100, y: 150 },
                data: {
                    label: "Get Quiz Results",
                    nodeType: "quiz-create",
                    config: { title: "", questions: [], timeLimit: 30, attempts: 1 }
                }
            },
            {
                id: "grade-1",
                type: "custom",
                position: { x: 350, y: 150 },
                data: {
                    label: "Calculate Scores",
                    nodeType: "grade-calculate",
                    config: { formula: "percentage", weights: {} }
                }
            },
            {
                id: "notify-1",
                type: "custom",
                position: { x: 600, y: 150 },
                data: {
                    label: "Send Results",
                    nodeType: "student-notify",
                    config: {
                        recipientType: "all",
                        message: "🎯 *Quiz Results*\n\nQuiz: {{quizName}}\nYour Score: {{score}}%\nClass Average: {{average}}%\n\n{{feedback}}",
                        channels: ["email", "whatsapp"]
                    }
                }
            }
        ],
        edges: [
            { id: "e1-2", source: "quiz-1", target: "grade-1", animated: true },
            { id: "e2-3", source: "grade-1", target: "notify-1", animated: true }
        ]
    },
    {
        id: "parent-meeting-reminder",
        name: "Parent-Teacher Meeting Reminder",
        description: "Send meeting reminders with join links for virtual meetings",
        category: "scheduling",
        difficulty: "easy",
        estimatedTime: "4 min",
        tags: ["meeting", "parents", "reminder", "zoom"],
        icon: Video,
        color: "from-indigo-500 to-violet-500",
        nodes: [
            {
                id: "schedule-1",
                type: "custom",
                position: { x: 100, y: 150 },
                data: {
                    label: "Check Meeting Schedule",
                    nodeType: "schedule-check",
                    config: { reminderMinutes: 60, date: "" }
                }
            },
            {
                id: "zoom-1",
                type: "custom",
                position: { x: 350, y: 150 },
                data: {
                    label: "Get Meeting Link",
                    nodeType: "zoom-meeting",
                    config: { action: "get", topic: "Parent-Teacher Meeting", duration: 30, waitingRoom: true }
                }
            },
            {
                id: "alert-1",
                type: "custom",
                position: { x: 600, y: 150 },
                data: {
                    label: "Send Reminder",
                    nodeType: "alert-send",
                    config: {
                        channels: ["whatsapp", "email"],
                        title: "Meeting Reminder",
                        message: "🤝 *Parent-Teacher Meeting Reminder*\n\nTime: {{time}}\nLink: {{meetingLink}}\n\nPlease join on time.",
                        recipients: "",
                        priority: "high"
                    }
                }
            }
        ],
        edges: [
            { id: "e1-2", source: "schedule-1", target: "zoom-1", animated: true },
            { id: "e2-3", source: "zoom-1", target: "alert-1", animated: true }
        ]
    },
    {
        id: "weekly-progress-report",
        name: "Weekly Progress Report",
        description: "Generate and send weekly student progress reports to parents",
        category: "grading",
        difficulty: "medium",
        estimatedTime: "7 min",
        tags: ["weekly", "progress", "report", "parents"],
        icon: TrendingUp,
        color: "from-emerald-500 to-green-600",
        nodes: [
            {
                id: "attendance-1",
                type: "custom",
                position: { x: 100, y: 100 },
                data: {
                    label: "Get Attendance Data",
                    nodeType: "attendance-track",
                    config: { threshold: 100, action: "summary", classId: "" }
                }
            },
            {
                id: "grades-1",
                type: "custom",
                position: { x: 100, y: 220 },
                data: {
                    label: "Get Academic Data",
                    nodeType: "grade-calculate",
                    config: { formula: "average", weights: {} }
                }
            },
            {
                id: "report-1",
                type: "custom",
                position: { x: 350, y: 150 },
                data: {
                    label: "Generate Report",
                    nodeType: "report-generate",
                    config: { reportType: "progress", format: "pdf", includeCharts: true }
                }
            },
            {
                id: "email-1",
                type: "custom",
                position: { x: 600, y: 150 },
                data: {
                    label: "Email Report",
                    nodeType: "email-send",
                    config: {
                        to: "",
                        subject: "Weekly Progress Report - {{studentName}}",
                        body: "Dear Parent,\n\nPlease find the weekly progress report attached.\n\nHighlights:\n- Attendance: {{attendancePercent}}%\n- Academic Score: {{academicScore}}\n\nBest regards"
                    }
                }
            }
        ],
        edges: [
            { id: "e1-3", source: "attendance-1", target: "report-1", animated: true },
            { id: "e2-3", source: "grades-1", target: "report-1", animated: true },
            { id: "e3-4", source: "report-1", target: "email-1", animated: true }
        ]
    },
    {
        id: "emergency-broadcast",
        name: "Emergency Broadcast",
        description: "Instantly notify all parents and staff about emergencies via all channels",
        category: "notifications",
        difficulty: "easy",
        estimatedTime: "2 min",
        tags: ["emergency", "broadcast", "urgent", "all-channels"],
        icon: AlertCircle,
        color: "from-red-600 to-rose-600",
        nodes: [
            {
                id: "alert-1",
                type: "custom",
                position: { x: 250, y: 150 },
                data: {
                    label: "Emergency Broadcast",
                    nodeType: "alert-send",
                    config: {
                        channels: ["whatsapp", "email", "sms", "slack"],
                        title: "🚨 URGENT NOTICE",
                        message: "🚨 *EMERGENCY NOTICE*\n\n{{message}}\n\nPlease take immediate action.\n\n- School Administration",
                        recipients: "",
                        priority: "critical"
                    }
                }
            }
        ],
        edges: []
    },
    {
        id: "homework-tracker",
        name: "Homework Submission Tracker",
        description: "Track homework submissions and remind students who haven't submitted",
        category: "assignments",
        difficulty: "medium",
        estimatedTime: "6 min",
        tags: ["homework", "tracking", "reminder", "submission"],
        icon: BookOpen,
        color: "from-orange-500 to-amber-600",
        nodes: [
            {
                id: "assignment-1",
                type: "custom",
                position: { x: 100, y: 150 },
                data: {
                    label: "Check Submissions",
                    nodeType: "assignment-create",
                    config: { title: "", description: "", dueDate: "", points: 100 }
                }
            },
            {
                id: "condition-1",
                type: "custom",
                position: { x: 350, y: 150 },
                data: {
                    label: "Not Submitted?",
                    nodeType: "condition",
                    config: { field: "submitted", operator: "equals", value: "false" }
                }
            },
            {
                id: "notify-1",
                type: "custom",
                position: { x: 600, y: 150 },
                data: {
                    label: "Send Reminder",
                    nodeType: "student-notify",
                    config: {
                        recipientType: "filtered",
                        message: "⏰ *Homework Reminder*\n\nYou haven't submitted: {{assignmentName}}\nDeadline: {{deadline}}\n\nPlease submit ASAP!",
                        channels: ["whatsapp"]
                    }
                }
            }
        ],
        edges: [
            { id: "e1-2", source: "assignment-1", target: "condition-1", animated: true },
            { id: "e2-3", source: "condition-1", target: "notify-1", animated: true }
        ]
    },
    {
        id: "fee-reminder",
        name: "Fee Payment Reminder",
        description: "Send automated fee payment reminders to parents with due amounts",
        category: "notifications",
        difficulty: "easy",
        estimatedTime: "4 min",
        tags: ["fee", "payment", "reminder", "finance"],
        icon: Timer,
        color: "from-amber-500 to-yellow-600",
        nodes: [
            {
                id: "schedule-1",
                type: "custom",
                position: { x: 100, y: 150 },
                data: {
                    label: "Check Due Date",
                    nodeType: "schedule-check",
                    config: { reminderMinutes: 4320, date: "" } // 3 days before
                }
            },
            {
                id: "alert-1",
                type: "custom",
                position: { x: 400, y: 150 },
                data: {
                    label: "Send Fee Reminder",
                    nodeType: "alert-send",
                    config: {
                        channels: ["whatsapp", "email", "sms"],
                        title: "Fee Payment Reminder",
                        message: "💰 *Fee Payment Reminder*\n\nDear Parent,\n\nThis is a reminder that school fees of ₹{{amount}} is due on {{dueDate}}.\n\nPayment Link: {{paymentLink}}\n\nThank you.",
                        recipients: "",
                        priority: "normal"
                    }
                }
            }
        ],
        edges: [
            { id: "e1-2", source: "schedule-1", target: "alert-1", animated: true }
        ]
    }
];

export default function TemplatesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isCreating, setIsCreating] = useState<string | null>(null);

    // Filter templates
    const filteredTemplates = templates.filter((template) => {
        const matchesSearch =
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const handleUseTemplate = async (template: typeof templates[0]) => {
        setIsCreating(template.id);
        try {
            // Create workflow from template
            const response = await fetch("/api/workflows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: template.name,
                    nodes: template.nodes,
                    edges: template.edges,
                    enabled: false, // Start disabled so user can configure
                }),
            });

            const data = await response.json();

            if (data.ok) {
                toast({
                    title: "Template Applied! 🎉",
                    description: `"${template.name}" workflow created. Configure the nodes and enable it.`,
                });
                router.push(`/dashboard/workflows/${data.data.id}/edit`);
            } else {
                throw new Error(data.error || "Failed to create workflow");
            }
        } catch (error) {
            console.error("Failed to create workflow from template:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create workflow",
                variant: "destructive",
            });
        } finally {
            setIsCreating(null);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "easy": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "hard": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* Header */}
            <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                Workflow Templates
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Ready-to-use automation templates for teachers • {templates.length} templates available
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search templates..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 w-64"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                {/* Category Tabs */}
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
                    <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
                        {categories.map((category) => (
                            <TabsTrigger
                                key={category.id}
                                value={category.id}
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-full border border-border data-[state=active]:border-primary transition-all"
                            >
                                <category.icon className="w-4 h-4 mr-2" />
                                {category.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* Popular Templates Section */}
                {selectedCategory === "all" && searchQuery === "" && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            <h2 className="text-xl font-semibold">Popular Templates</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.filter(t => t.popular).slice(0, 6).map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onUse={handleUseTemplate}
                                    isCreating={isCreating === template.id}
                                    getDifficultyColor={getDifficultyColor}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* All/Filtered Templates */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">
                            {selectedCategory === "all" ? "All Templates" : categories.find(c => c.id === selectedCategory)?.label}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {filteredTemplates.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed rounded-xl">
                            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground">No templates found</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Try adjusting your search or category filter
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTemplates.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onUse={handleUseTemplate}
                                    isCreating={isCreating === template.id}
                                    getDifficultyColor={getDifficultyColor}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TemplateCard({
    template,
    onUse,
    isCreating,
    getDifficultyColor,
}: {
    template: typeof templates[0];
    onUse: (template: typeof templates[0]) => void;
    isCreating: boolean;
    getDifficultyColor: (difficulty: string) => string;
}) {
    const Icon = template.icon;

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden">
            {/* Gradient Top Bar */}
            <div className={`h-2 bg-gradient-to-r ${template.color}`} />

            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${template.color} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        {template.popular && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Popular
                            </Badge>
                        )}
                    </div>
                </div>
                <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
                    {template.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                    {template.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {template.estimatedTime}
                    </div>
                    <Badge className={getDifficultyColor(template.difficulty)} variant="secondary">
                        {template.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {template.nodes.length} nodes
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                    {template.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                    {template.tags.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                            +{template.tags.length - 4}
                        </Badge>
                    )}
                </div>

                {/* Action Button */}
                <Button
                    onClick={() => onUse(template)}
                    disabled={isCreating}
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    variant="outline"
                >
                    {isCreating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            Creating...
                        </>
                    ) : (
                        <>
                            Use Template
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
