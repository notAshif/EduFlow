import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BlogPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">EduFlow Blog</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Insights, tips, and stories from the world of education technology.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    {
                        title: "How AI is Changing the Classroom",
                        excerpt: "Artificial Intelligence isn't here to replace teachers, but to give them superpowers. Here's how.",
                        date: "Nov 28, 2025",
                        tag: "AI",
                        readTime: "5 min read"
                    },
                    {
                        title: "5 Workflows Every Teacher Needs",
                        excerpt: "Stop doing manual data entry. These 5 automated workflows will save you 5+ hours a week.",
                        date: "Nov 25, 2025",
                        tag: "Guides",
                        readTime: "8 min read"
                    },
                    {
                        title: "The Future of Hybrid Learning",
                        excerpt: "As schools adapt to new models, technology plays a crucial role in keeping students connected.",
                        date: "Nov 20, 2025",
                        tag: "Trends",
                        readTime: "6 min read"
                    },
                    {
                        title: "Case Study: Lincoln High School",
                        excerpt: "How one high school reduced administrative overhead by 40% using EduFlow.",
                        date: "Nov 15, 2025",
                        tag: "Case Study",
                        readTime: "10 min read"
                    },
                    {
                        title: "Understanding FERPA Compliance",
                        excerpt: "A simple guide to student data privacy and how to ensure your tools are compliant.",
                        date: "Nov 10, 2025",
                        tag: "Security",
                        readTime: "7 min read"
                    },
                    {
                        title: "New Integration: Canvas LMS",
                        excerpt: "We're excited to announce our deep integration with Canvas. Here's what you can do.",
                        date: "Nov 5, 2025",
                        tag: "Product",
                        readTime: "3 min read"
                    }
                ].map((post, i) => (
                    <Link key={i} href="#" className="group">
                        <Card className="h-full hover:shadow-lg transition-all border-border/50 bg-card/50">
                            <div className="aspect-video bg-muted rounded-t-xl w-full" />
                            <CardHeader>
                                <div className="flex justify-between items-center mb-2">
                                    <Badge variant="secondary" className="text-xs">{post.tag}</Badge>
                                    <span className="text-xs text-muted-foreground">{post.readTime}</span>
                                </div>
                                <CardTitle className="group-hover:text-primary transition-colors">{post.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
                                <p className="text-xs text-muted-foreground">{post.date}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
