// scripts/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  
  try {
    // Create organization
    const organization = await prisma.organization.upsert({
      where: { id: 'demo-org' },
      update: {},
      create: {
        id: 'demo-org',
        name: 'Demo School',
        plan: 'premium',
      },
    });
    
    console.log('Created organization:', organization.name);
    
    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { clerkId: 'seed-admin' },
      update: {},
      create: {
        clerkId: 'seed-admin',
        email: 'admin@demo.edu',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        organizationId: organization.id,
      },
    });
    
    console.log('Created admin user:', adminUser.email);
    
    // Create teacher user
    const teacherUser = await prisma.user.upsert({
      where: { clerkId: 'seed-teacher' },
      update: {},
      create: {
        clerkId: 'seed-teacher',
        email: 'teacher@demo.edu',
        firstName: 'Teacher',
        lastName: 'User',
        role: 'teacher',
        organizationId: organization.id,
      },
    });
    
    console.log('Created teacher user:', teacherUser.email);
    
    // Create student users
    for (let i = 1; i <= 5; i++) {
      const studentUser = await prisma.user.upsert({
        where: { clerkId: `seed-student-${i}` },
        update: {},
        create: {
          clerkId: `seed-student-${i}`,
          email: `student${i}@demo.edu`,
          firstName: `Student`,
          lastName: `${i}`,
          role: 'student',
          organizationId: organization.id,
        },
      });
      
      console.log(`Created student user: ${studentUser.email}`);
    }
    
    // Create example assignment
    const assignment = await prisma.assignment.create({
      data: {
        title: 'Introduction to Workflow Automation',
        description: 'Learn how to create automated workflows for educational tasks.',
        attachments: {
          files: [
            { name: 'workflow-guide.pdf', url: '/files/workflow-guide.pdf' },
            { name: 'examples.zip', url: '/files/examples.zip' },
          ],
        },
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        organizationId: organization.id,
        createdByUserId: teacherUser.id,
      },
    });
    
    console.log('Created assignment:', assignment.title);
    
    // Create class schedules
    const classSchedules = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', subject: 'Mathematics' },
      { dayOfWeek: 2, startTime: '10:00', endTime: '11:00', subject: 'Science' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '10:00', subject: 'English' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '11:00', subject: 'History' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '10:00', subject: 'Computer Science' },
    ];
    
    for (const schedule of classSchedules) {
      await prisma.classSchedule.create({
        data: {
          classId: 'class-101',
          ...schedule,
          teacherId: teacherUser.clerkId,
          organizationId: organization.id,
        },
      });
    }
    
    console.log('Created class schedules');
    
    // Create example workflows
    const attendanceWorkflow = await prisma.workflow.create({
      data: {
        name: 'Daily Attendance Notification',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Schedule Trigger',
              config: { time: '09:00', days: [1, 2, 3, 4, 5] },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 300, y: 100 },
            data: {
              label: 'Check Absent Students',
              config: { field: 'attendance.status', operator: 'equals', value: 'absent' },
            },
          },
          {
            id: 'sms-1',
            type: 'twilio-sms',
            position: { x: 500, y: 100 },
            data: {
              label: 'Send SMS to Parent',
              config: { 
                to: '+1234567890', 
                message: 'Your child was marked absent from class today.' 
              },
            },
          },
          {
            id: 'email-1',
            type: 'email-send',
            position: { x: 500, y: 200 },
            data: {
              label: 'Send Email to Teacher',
              config: { 
                to: 'teacher@demo.edu', 
                subject: 'Attendance Alert',
                body: 'A student was marked absent from your class.' 
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'condition-1' },
          { id: 'e2', source: 'condition-1', target: 'sms-1' },
          { id: 'e3', source: 'condition-1', target: 'email-1' },
        ],
        enabled: true,
        organizationId: organization.id,
      },
    });
    
    console.log('Created attendance workflow');
    
    const assignmentReminderWorkflow = await prisma.workflow.create({
      data: {
        name: 'Assignment Reminder',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Schedule Trigger',
              config: { time: '18:00', days: [1, 2, 3, 4, 5] },
            },
          },
          {
            id: 'ai-1',
            type: 'local-ai',
            position: { x: 300, y: 100 },
            data: {
              label: 'Generate Summary',
              config: { 
                text: 'Assignment due tomorrow: Introduction to Workflow Automation',
                mode: 'summary' 
              },
            },
          },
          {
            id: 'slack-1',
            type: 'slack-send',
            position: { x: 500, y: 100 },
            data: {
              label: 'Post to Slack',
              config: { 
                webhookUrl: 'https://hooks.slack.com/services/xxx',
                message: 'Reminder: Assignment due tomorrow!' 
              },
            },
          },
          {
            id: 'email-1',
            type: 'email-send',
            position: { x: 500, y: 200 },
            data: {
              label: 'Send Email Reminder',
              config: { 
                to: 'students@demo.edu', 
                subject: 'Assignment Reminder',
                body: 'Don\'t forget to submit your assignment by tomorrow!' 
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'ai-1' },
          { id: 'e2', source: 'ai-1', target: 'slack-1' },
          { id: 'e3', source: 'ai-1', target: 'email-1' },
        ],
        enabled: true,
        organizationId: organization.id,
      },
    });
    
    console.log('Created assignment reminder workflow');
    
    // Create sample integration connections (with mock credentials)
    await prisma.integrationConnection.createMany({
      data: [
        {
          type: 'twilio',
          credentials: {
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            fromNumber: '+1234567890',
          },
          organizationId: organization.id,
        },
        {
          type: 'gmail',
          credentials: {
            host: 'smtp.gmail.com',
            port: 587,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          organizationId: organization.id,
        },
      ],
      skipDuplicates: true,
    });
    
    console.log('Created sample integration connections');
    
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });