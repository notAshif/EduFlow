// lib/services/llm-service.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Ollama } from "@langchain/ollama";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export type LLMProvider = 'openai' | 'google' | 'ollama' | 'local';

export interface LLMOptions {
    provider?: LLMProvider;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    apiKey?: string;
    baseUrl?: string; // For Ollama or other local providers
}

/**
 * LLMService - A unified service for AI and Local AI services using LangChain
 */
export class LLMService {
    /**
     * Get an LLM instance based on the provider
     */
    static getModel(options: LLMOptions): BaseChatModel | BaseLanguageModel {
        const {
            provider = 'openai',
            model,
            temperature = 0.7,
            maxTokens = 1000,
            apiKey,
            baseUrl
        } = options;

        switch (provider) {
            case 'openai':
                return new ChatOpenAI({
                    openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
                    model: model || 'gpt-3.5-turbo',
                    temperature,
                    maxTokens,
                });

            case 'google':
                return new ChatGoogleGenerativeAI({
                    apiKey: apiKey || process.env.GEMINI_API_KEY,
                    model: model || 'gemini-2.5-flash',
                    temperature,
                    maxOutputTokens: maxTokens,
                });

            case 'ollama':
            case 'local':
                return new Ollama({
                    baseUrl: baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434",
                    model: model || "llama3",
                    temperature,
                });

            default:
                throw new Error(`Unsupported LLM provider: ${provider}`);
        }
    }

    /**
     * Simple chat interface
     */
    static async chat(
        systemPrompt: string,
        userPrompt: string,
        options: LLMOptions = {}
    ): Promise<{ content: string; model: string }> {
        const modelInstance = this.getModel(options);

        try {
            if (modelInstance instanceof BaseChatModel) {
                const response = await modelInstance.invoke([
                    new SystemMessage(systemPrompt),
                    new HumanMessage(userPrompt)
                ]);

                return {
                    content: String(response.content),
                    model: options.model || (options.provider === 'google' ? 'gemini-1.5-flash' : 'gpt-3.5-turbo')
                };
            } else {
                // For LLMs that aren't ChatModels (like Ollama)
                const prompt = `${systemPrompt}\n\nHuman: ${userPrompt}\n\nAssistant:`;
                const response = await modelInstance.invoke(prompt);

                return {
                    content: String(response),
                    model: options.model || "local-model"
                };
            }
        } catch (error) {
            console.error(`[LLMService] Error calling ${options.provider}:`, error);
            throw error;
        }
    }
}
