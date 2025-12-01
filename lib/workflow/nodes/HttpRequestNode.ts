/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/workflow/nodes/HttpRequestNode.ts
import { BaseNode } from "../node-base";
import { NodeExecutionContext } from "@/lib/types";

export class HttpRequestNode extends BaseNode {
  validate(config: any): void {
    if (!config.url) {
      throw new Error("URL is required");
    }

    if (!config.method) {
      config.method = "GET";
    }

    if (
      !["GET", "POST", "PUT", "DELETE", "PATCH"].includes(
        config.method.toUpperCase()
      )
    ) {
      throw new Error("Invalid HTTP method");
    }
  }

  async execute(_: NodeExecutionContext): Promise<any> {
    const {
      url,
      method = "GET",
      headers = {},
      body,
      timeout = 30000,
    } = this.config;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`HTTP request timed out after ${timeout}ms`);
      }
      throw new Error(
        `HTTP request failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
