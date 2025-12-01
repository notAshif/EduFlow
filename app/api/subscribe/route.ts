import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { newsletterWelcomeTemplate } from "@/app/lib/email-templates";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Check if SMTP configuration is present
        if (
            !process.env.SMTP_HOST ||
            !process.env.SMTP_USER ||
            !process.env.SMTP_PASS
        ) {
            console.log("SMTP configuration missing. Mocking email send to:", email);
            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return NextResponse.json({
                success: true,
                message: "Subscribed successfully (Mock Mode)",
            });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"EduFlow" <noreply@eduflow.com>',
                to: email,
                subject: "Welcome to EduFlow Updates!",
                html: newsletterWelcomeTemplate(email),
            });

            return NextResponse.json({
                success: true,
                message: "Subscribed successfully",
            });
        } catch (emailError) {
            console.error("Failed to send email:", emailError);
            return NextResponse.json(
                { error: "Failed to send confirmation email" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Subscription error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
