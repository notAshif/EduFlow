import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
                <div>
                    <h1 className="text-4xl font-bold mb-6">Get in Touch</h1>
                    <p className="text-xl text-muted-foreground mb-12">
                        Have questions about EduFlow? We'd love to hear from you. Our team is ready to help.
                    </p>

                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Email</h3>
                                <p className="text-muted-foreground mb-1">Our friendly team is here to help.</p>
                                <a href="mailto:support@eduflow.com" className="text-primary hover:underline">support@eduflow.com</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Office</h3>
                                <p className="text-muted-foreground mb-1">Come say hello at our office headquarters.</p>
                                <p className="text-foreground">100 Smith Street<br />Collingwood VIC 3066 AU</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Phone</h3>
                                <p className="text-muted-foreground mb-1">Mon-Fri from 8am to 5pm.</p>
                                <a href="tel:+15550000000" className="text-primary hover:underline">+1 (555) 000-0000</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                    <form className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">First name</label>
                                <Input placeholder="First name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Last name</label>
                                <Input placeholder="Last name" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" placeholder="you@company.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message</label>
                            <Textarea placeholder="Leave us a message..." className="min-h-[150px]" />
                        </div>
                        <Button className="w-full" size="lg">Send Message</Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
