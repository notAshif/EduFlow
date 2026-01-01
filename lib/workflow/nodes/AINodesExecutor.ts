// lib/workflow/nodes/AINodesExecutor.ts
// Comprehensive AI node implementations using LLM models

import { NodeExecutionContext } from '@/lib/types';
import { LLMService, LLMProvider } from '@/lib/services/llm-service';

export interface AINodeConfig {
    text?: string;
    model?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    dataType?: string;
    chartType?: string;
    dataPoints?: any[];
    analysisType?: string;
    prompt?: string;
    maxTokens?: number;
    temperature?: number;
}

// Helper to get API key from credentials or environment
function getApiKey(credentials: Record<string, any>): string | null {
    return credentials?.apiKey
        || credentials?.openaiApiKey
        || process.env.OPENAI_API_KEY
        || process.env.GEMINI_API_KEY
        || null;
}

// Common function to call LLM using LLMService (LangChain)
async function callLLM(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string,
    options: { model?: string; maxTokens?: number; temperature?: number; provider?: LLMProvider; baseUrl?: string } = {}
): Promise<{ content: string; tokensUsed?: number; model: string }> {
    const { model = 'gpt-3.5-turbo', maxTokens = 1000, temperature = 0.7, provider, baseUrl } = options;

    // Detect provider if not specified
    let resolvedProvider: LLMProvider = provider || 'openai';

    if (!provider) {
        if (apiKey.startsWith('AIza') || model.includes('gemini')) {
            resolvedProvider = 'google';
        } else if (model.includes('llama') || model.includes('mistral') || baseUrl) {
            resolvedProvider = 'ollama';
        }
    }

    const result = await LLMService.chat(systemPrompt, userPrompt, {
        provider: resolvedProvider,
        model,
        maxTokens,
        temperature,
        apiKey,
        baseUrl
    });

    return {
        content: result.content,
        model: result.model
    };
}

// ==================== AI ANALYSIS ====================
export async function executeAIAnalysis(
    config: AINodeConfig,
    credentials: Record<string, any>,
    input: any
): Promise<any> {
    const apiKey = getApiKey(credentials);
    const text = config.text || input?.text || input?.data || '';
    const analysisType = config.analysisType || 'general';

    if (!apiKey) {
        return {
            success: false,
            nodeType: 'ai-analysis',
            message: 'API key required for AI Analysis',
            output: { error: 'No API key configured. Please add OpenAI or Gemini integration.' },
        };
    }

    if (!text) {
        return {
            success: false,
            nodeType: 'ai-analysis',
            message: 'No text provided for analysis',
            output: { error: 'No text or data provided' },
        };
    }

    const analysisPrompts: Record<string, string> = {
        general: 'Analyze the following content and provide insights, patterns, and key observations.',
        educational: 'Analyze this educational content. Identify learning objectives, key concepts, difficulty level, and suggested improvements.',
        performance: 'Analyze this performance data. Identify trends, outliers, areas of improvement, and recommendations.',
        feedback: 'Analyze this feedback/survey data. Identify common themes, sentiment distribution, and actionable insights.',
        academic: 'Analyze this academic content for quality, accuracy, and completeness. Provide constructive feedback.',
    };

    const systemPrompt = `You are an expert analyst. Provide detailed, actionable analysis in JSON format with the following structure:
{
    "summary": "Brief overview of findings",
    "insights": ["insight 1", "insight 2", ...],
    "recommendations": ["recommendation 1", ...],
    "metrics": { "key": "value" },
    "confidence": 0.0-1.0
}`;

    const userPrompt = `${analysisPrompts[analysisType] || analysisPrompts.general}\n\nContent to analyze:\n${typeof text === 'object' ? JSON.stringify(text, null, 2) : text}`;

    try {
        const result = await callLLM(apiKey, systemPrompt, userPrompt, {
            model: config.model,
            maxTokens: config.maxTokens || 1500,
            temperature: config.temperature || 0.5,
        });

        // Try to parse JSON from response
        let analysisResult;
        try {
            const jsonMatch = result.content.match(/\{[\s\S]*\}/);
            analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: result.content };
        } catch {
            analysisResult = { summary: result.content, insights: [], recommendations: [] };
        }

        return {
            success: true,
            nodeType: 'ai-analysis',
            label: 'AI Analysis',
            message: 'Content analyzed successfully',
            timestamp: new Date().toISOString(),
            output: {
                analysisType,
                ...analysisResult,
                originalLength: typeof text === 'string' ? text.length : JSON.stringify(text).length,
                model: result.model,
                tokensUsed: result.tokensUsed,
            },
        };
    } catch (error) {
        console.error('[AINodesExecutor:ai-analysis] Error:', error);
        return {
            success: false,
            nodeType: 'ai-analysis',
            message: 'Failed to analyze content',
            output: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}

// ==================== AI SUMMARIZE ====================
export async function executeAISummarize(
    config: AINodeConfig,
    credentials: Record<string, any>,
    input: any
): Promise<any> {
    const apiKey = getApiKey(credentials);
    const text = config.text || input?.text || '';

    if (!apiKey) {
        return {
            success: false,
            nodeType: 'ai-summarize',
            message: 'API key required for AI Summarize',
            output: { error: 'No API key configured.' },
        };
    }

    if (!text) {
        return {
            success: false,
            nodeType: 'ai-summarize',
            message: 'No text provided to summarize',
            output: { error: 'No text provided' },
        };
    }

    const systemPrompt = `You are a summarization expert. Provide a concise summary of the text with:
1. A brief overview (2-3 sentences)
2. Key points (bullet format)
3. Overall sentiment (positive/neutral/negative)

Respond in JSON format:
{
    "summary": "...",
    "keyPoints": ["point 1", "point 2", ...],
    "sentiment": "positive|neutral|negative",
    "wordCount": number
}`;

    try {
        const result = await callLLM(apiKey, systemPrompt, text, {
            model: config.model,
            maxTokens: config.maxTokens || 800,
            temperature: 0.3,
        });

        let parsed;
        try {
            const jsonMatch = result.content.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: result.content };
        } catch {
            parsed = { summary: result.content, keyPoints: [], sentiment: 'neutral' };
        }

        return {
            success: true,
            nodeType: 'ai-summarize',
            label: 'AI Summary',
            message: 'Text summarized successfully',
            timestamp: new Date().toISOString(),
            output: {
                originalLength: text.length,
                ...parsed,
                model: result.model,
                tokensUsed: result.tokensUsed,
            },
        };
    } catch (error) {
        console.error('[AINodesExecutor:ai-summarize] Error:', error);
        return {
            success: false,
            nodeType: 'ai-summarize',
            message: 'Failed to summarize text',
            output: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}

// ==================== AI TRANSLATE ====================
export async function executeAITranslate(
    config: AINodeConfig,
    credentials: Record<string, any>,
    input: any
): Promise<any> {
    const apiKey = getApiKey(credentials);
    const text = config.text || input?.text || '';
    const sourceLanguage = config.sourceLanguage || 'auto';
    const targetLanguage = config.targetLanguage || 'English';

    if (!apiKey) {
        return {
            success: false,
            nodeType: 'ai-translate',
            message: 'API key required for AI Translate',
            output: { error: 'No API key configured.' },
        };
    }

    if (!text) {
        return {
            success: false,
            nodeType: 'ai-translate',
            message: 'No text provided to translate',
            output: { error: 'No text provided' },
        };
    }

    const systemPrompt = `You are a professional translator. Translate the following text to ${targetLanguage}.
${sourceLanguage !== 'auto' ? `The source language is ${sourceLanguage}.` : 'Auto-detect the source language.'}

After translation, respond in JSON format:
{
    "translatedText": "...",
    "detectedLanguage": "source language name",
    "targetLanguage": "${targetLanguage}",
    "confidence": 0.0-1.0
}

Preserve formatting, tone, and meaning as closely as possible.`;

    try {
        const result = await callLLM(apiKey, systemPrompt, text, {
            model: config.model,
            maxTokens: config.maxTokens || 2000,
            temperature: 0.3,
        });

        let parsed;
        try {
            const jsonMatch = result.content.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { translatedText: result.content };
        } catch {
            parsed = { translatedText: result.content, detectedLanguage: 'unknown', confidence: 0.8 };
        }

        return {
            success: true,
            nodeType: 'ai-translate',
            label: 'AI Translation',
            message: `Translated to ${targetLanguage}`,
            timestamp: new Date().toISOString(),
            output: {
                originalText: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                originalLength: text.length,
                ...parsed,
                model: result.model,
                tokensUsed: result.tokensUsed,
            },
        };
    } catch (error) {
        console.error('[AINodesExecutor:ai-translate] Error:', error);
        return {
            success: false,
            nodeType: 'ai-translate',
            message: 'Failed to translate text',
            output: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}

// ==================== SENTIMENT ANALYSIS ====================
export async function executeSentimentAnalysis(
    config: AINodeConfig,
    credentials: Record<string, any>,
    input: any
): Promise<any> {
    const apiKey = getApiKey(credentials);
    const text = config.text || input?.text || '';

    if (!apiKey) {
        return {
            success: false,
            nodeType: 'sentiment-analysis',
            message: 'API key required for Sentiment Analysis',
            output: { error: 'No API key configured.' },
        };
    }

    if (!text) {
        return {
            success: false,
            nodeType: 'sentiment-analysis',
            message: 'No text provided for sentiment analysis',
            output: { error: 'No text provided' },
        };
    }

    const systemPrompt = `You are a sentiment analysis expert. Analyze the sentiment of the following text and provide:

Respond in JSON format:
{
    "sentiment": "positive|negative|neutral|mixed",
    "sentimentScore": -1.0 to 1.0 (negative to positive),
    "confidence": 0.0-1.0,
    "emotions": {
        "joy": 0.0-1.0,
        "sadness": 0.0-1.0,
        "anger": 0.0-1.0,
        "fear": 0.0-1.0,
        "surprise": 0.0-1.0
    },
    "keywords": ["word1", "word2", ...],
    "summary": "Brief explanation of the sentiment"
}`;

    try {
        const result = await callLLM(apiKey, systemPrompt, text, {
            model: config.model,
            maxTokens: 500,
            temperature: 0.3,
        });

        let parsed;
        try {
            const jsonMatch = result.content.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { sentiment: 'neutral', sentimentScore: 0 };
        } catch {
            // Fallback: try to detect sentiment from text
            const lowerContent = result.content.toLowerCase();
            let sentiment = 'neutral';
            let score = 0;
            if (lowerContent.includes('positive')) { sentiment = 'positive'; score = 0.7; }
            else if (lowerContent.includes('negative')) { sentiment = 'negative'; score = -0.7; }
            parsed = { sentiment, sentimentScore: score, summary: result.content };
        }

        return {
            success: true,
            nodeType: 'sentiment-analysis',
            label: 'Sentiment Analysis',
            message: `Sentiment: ${parsed.sentiment}`,
            timestamp: new Date().toISOString(),
            output: {
                textSample: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                textLength: text.length,
                ...parsed,
                model: result.model,
                tokensUsed: result.tokensUsed,
            },
        };
    } catch (error) {
        console.error('[AINodesExecutor:sentiment-analysis] Error:', error);
        return {
            success: false,
            nodeType: 'sentiment-analysis',
            message: 'Failed to analyze sentiment',
            output: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}

// ==================== GENERATE CHART ====================
export async function executeGenerateChart(
    config: AINodeConfig,
    credentials: Record<string, any>,
    input: any
): Promise<any> {
    const dataPoints = config.dataPoints || input?.data || input?.dataPoints || [];
    const chartType = config.chartType || 'bar';
    const title = config.prompt || 'Data Visualization';

    // Generate chart configuration (can be used with Chart.js or similar)
    const chartConfig = {
        type: chartType,
        data: {
            labels: dataPoints.map((d: any, i: number) => d.label || d.name || `Item ${i + 1}`),
            datasets: [{
                label: title,
                data: dataPoints.map((d: any) => d.value || d.count || d),
                backgroundColor: generateColors(dataPoints.length),
                borderColor: generateColors(dataPoints.length, true),
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: title },
                legend: { position: 'top' as const },
            },
        },
    };

    // Generate chart URL using QuickChart API
    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;

    return {
        success: true,
        nodeType: 'chart-generate',
        label: 'Generate Chart',
        message: `${chartType} chart generated`,
        timestamp: new Date().toISOString(),
        output: {
            chartType,
            title,
            dataPointsCount: dataPoints.length,
            chartConfig,
            chartUrl,
            embedCode: `<img src="${chartUrl}" alt="${title}" />`,
        },
    };
}

// Helper function to generate colors
function generateColors(count: number, border = false): string[] {
    const baseColors = [
        { r: 59, g: 130, b: 246 },   // Blue
        { r: 16, g: 185, b: 129 },   // Green
        { r: 245, g: 158, b: 11 },   // Amber
        { r: 239, g: 68, b: 68 },    // Red
        { r: 139, g: 92, b: 246 },   // Purple
        { r: 236, g: 72, b: 153 },   // Pink
        { r: 6, g: 182, b: 212 },    // Cyan
        { r: 249, g: 115, b: 22 },   // Orange
    ];

    return Array.from({ length: count }, (_, i) => {
        const color = baseColors[i % baseColors.length];
        return border
            ? `rgba(${color.r}, ${color.g}, ${color.b}, 1)`
            : `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
    });
}

// ==================== TRACK ANALYTICS ====================
export async function executeTrackAnalytics(
    config: AINodeConfig,
    credentials: Record<string, any>,
    input: any,
    context: any
): Promise<any> {
    const eventName = config.prompt || input?.eventName || 'workflow_event';
    const eventData = input?.data || config.dataPoints || {};

    // In production, this would send to an analytics service
    const analyticsEvent = {
        eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventName,
        timestamp: new Date().toISOString(),
        workflowId: context?.workflowId,
        runId: context?.runId,
        organizationId: context?.organizationId,
        data: eventData,
        metadata: {
            source: 'workflow',
            nodeType: 'analytics-track',
        },
    };

    console.log('[Analytics] Event tracked:', analyticsEvent);

    return {
        success: true,
        nodeType: 'analytics-track',
        label: 'Track Analytics',
        message: `Event "${eventName}" tracked`,
        timestamp: new Date().toISOString(),
        output: {
            event: analyticsEvent,
            tracked: true,
        },
    };
}

// ==================== POWER BI INTEGRATION ====================
export async function executePowerBI(
    config: AINodeConfig,
    credentials: Record<string, any>,
    input: any
): Promise<any> {
    // Power BI requires Azure AD authentication
    const accessToken = credentials?.accessToken || credentials?.powerbiToken;
    const action = config.analysisType || 'get-reports';

    if (!accessToken) {
        return {
            success: false,
            nodeType: 'power-bi',
            label: 'Power BI',
            message: 'Power BI authentication required',
            timestamp: new Date().toISOString(),
            output: {
                action,
                configured: false,
                error: 'Power BI requires Microsoft Azure AD authentication. Please connect your Microsoft account in the Integrations page.',
            },
        };
    }

    // Real Power BI API call would go here
    try {
        const baseUrl = 'https://api.powerbi.com/v1.0/myorg';
        let endpoint = '/reports';

        const response = await fetch(`${baseUrl}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error(`Power BI API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            success: true,
            nodeType: 'power-bi',
            label: 'Power BI',
            message: 'Power BI data retrieved',
            timestamp: new Date().toISOString(),
            output: {
                action,
                reports: data.value || [],
                totalCount: data.value?.length || 0,
            },
        };
    } catch (error) {
        console.error('[AINodesExecutor:power-bi] Error:', error);
        return {
            success: false,
            nodeType: 'power-bi',
            message: 'Failed to access Power BI',
            output: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}
