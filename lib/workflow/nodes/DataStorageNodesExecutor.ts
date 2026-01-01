// lib/workflow/nodes/DataStorageNodesExecutor.ts
// Comprehensive Data & Storage node implementations

import { NodeExecutionContext } from '@/lib/types';

export interface DataStorageNodeConfig {
    // Database Query
    query?: string;
    database?: string;
    connectionString?: string;

    // Spreadsheet
    spreadsheetId?: string;
    sheetName?: string;
    range?: string;
    values?: any[][];
    action?: string;

    // File operations
    filePath?: string;
    fileName?: string;
    content?: string;
    encoding?: string;

    // JSON
    jsonString?: string;
    jsonPath?: string;
    data?: any;
}

// ==================== DATABASE QUERY ====================
export async function executeDatabaseQuery(
    config: DataStorageNodeConfig,
    credentials: Record<string, any>,
    input: any,
    context: any
): Promise<any> {
    const query = config.query || input?.query || '';
    const database = config.database || 'prisma';

    if (!query) {
        return {
            success: false,
            nodeType: 'database-query',
            message: 'No query provided',
            output: { error: 'Query is required' },
        };
    }

    // For security, we'll parse and execute safe queries only
    // In production, this would use a proper query builder
    try {
        if (database === 'internal' && context?.organizationId) {
            // Execute against internal tables only
            const { prisma } = await import('@/lib/db');

            // Supported internal "tables" (Prisma models)
            const queryLower = query.toLowerCase().trim();

            if (queryLower.includes('workflow_runs') || queryLower.includes('workflowrun')) {
                const runs = await prisma.workflowRun.findMany({
                    where: { organizationId: context.organizationId },
                    take: 50,
                    orderBy: { startedAt: 'desc' },
                });

                return {
                    success: true,
                    nodeType: 'database-query',
                    label: 'Database Query',
                    message: `Retrieved ${runs.length} workflow runs`,
                    timestamp: new Date().toISOString(),
                    output: {
                        rowCount: runs.length,
                        rows: runs,
                        model: 'WorkflowRun'
                    },
                };
            }

            if (queryLower.includes('assignments') || queryLower.includes('assignment')) {
                const assignments = await prisma.assignment.findMany({
                    where: { organizationId: context.organizationId },
                    take: 50,
                });

                return {
                    success: true,
                    nodeType: 'database-query',
                    label: 'Database Query',
                    message: `Retrieved ${assignments.length} assignments`,
                    timestamp: new Date().toISOString(),
                    output: {
                        rowCount: assignments.length,
                        rows: assignments,
                        model: 'Assignment'
                    },
                };
            }

            return {
                success: false,
                nodeType: 'database-query',
                message: 'Query not supported on internal database. Supported tables: workflow_runs, assignments.',
                output: { error: 'Unsupported internal table query' }
            };
        }

        return {
            success: false,
            nodeType: 'database-query',
            message: `External database connections (${database}) are not currently configured for this environment.`,
            output: { error: 'Database provider not configured' },
        };
    } catch (error) {
        console.error('[DataStorageNodes:database-query] Error:', error);
        return {
            success: false,
            nodeType: 'database-query',
            message: 'Database query failed',
            output: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}

// ==================== UPDATE SPREADSHEET ====================
export async function executeUpdateSpreadsheet(
    config: DataStorageNodeConfig,
    credentials: Record<string, any>,
    input: any
): Promise<any> {
    const spreadsheetId = config.spreadsheetId || input?.spreadsheetId;
    const sheetName = config.sheetName || 'Sheet1';
    const range = config.range || 'A1';
    const values = config.values || input?.values || input?.data || [];
    const action = config.action || 'update';
    const accessToken = credentials?.accessToken;

    if (!spreadsheetId) {
        return {
            success: false,
            nodeType: 'spreadsheet-update',
            message: 'Spreadsheet ID required',
            output: { error: 'No spreadsheet ID provided' },
        };
    }

    if (!accessToken) {
        return {
            success: false,
            nodeType: 'spreadsheet-update',
            message: 'Google access token required',
            output: { error: 'Please connect your Google account' },
        };
    }

    try {
        const fullRange = `${sheetName}!${range}`;
        const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;

        let endpoint = '';
        let method = 'GET';
        let body: string | undefined;

        // Format values as 2D array if needed
        const formattedValues = Array.isArray(values[0]) ? values : [values];

        switch (action) {
            case 'update':
            case 'write':
                endpoint = `/values/${encodeURIComponent(fullRange)}?valueInputOption=USER_ENTERED`;
                method = 'PUT';
                body = JSON.stringify({ values: formattedValues });
                break;
            case 'append':
                endpoint = `/values/${encodeURIComponent(fullRange)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
                method = 'POST';
                body = JSON.stringify({ values: formattedValues });
                break;
            case 'read':
                endpoint = `/values/${encodeURIComponent(fullRange)}`;
                method = 'GET';
                break;
            case 'clear':
                endpoint = `/values/${encodeURIComponent(fullRange)}:clear`;
                method = 'POST';
                body = JSON.stringify({});
                break;
            default:
                endpoint = `/values/${encodeURIComponent(fullRange)}`;
        }

        const response = await fetch(`${baseUrl}${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        return {
            success: true,
            nodeType: 'spreadsheet-update',
            label: 'Update Spreadsheet',
            message: `Spreadsheet ${action} successful`,
            timestamp: new Date().toISOString(),
            output: {
                spreadsheetId,
                range: data.range || fullRange,
                action,
                updatedRows: data.updatedRows || formattedValues.length,
                updatedColumns: data.updatedColumns || (formattedValues[0]?.length || 0),
                updatedCells: data.updatedCells,
                values: action === 'read' ? data.values : formattedValues,
            },
        };
    } catch (error) {
        console.error('[DataStorageNodes:spreadsheet-update] Error:', error);
        return {
            success: false,
            nodeType: 'spreadsheet-update',
            message: 'Spreadsheet operation failed',
            output: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}

// ==================== READ FILE ====================
export async function executeReadFile(
    config: DataStorageNodeConfig,
    credentials: Record<string, any>,
    input: any
): Promise<any> {
    const filePath = config.filePath || config.fileName || input?.filePath || '';
    const encoding = config.encoding || 'utf-8';

    if (!filePath) {
        return {
            success: false,
            nodeType: 'file-read',
            message: 'File path required',
            output: { error: 'No file path provided' },
        };
    }

    try {
        // Check if it's a URL or local path
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            // Fetch from URL
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const contentType = response.headers.get('content-type') || '';
            let content: any;
            let fileType = 'text';

            if (contentType.includes('application/json')) {
                content = await response.json();
                fileType = 'json';
            } else if (contentType.includes('text/csv')) {
                content = await response.text();
                fileType = 'csv';
            } else {
                content = await response.text();
            }

            return {
                success: true,
                nodeType: 'file-read',
                label: 'Read File',
                message: 'File read successfully',
                timestamp: new Date().toISOString(),
                output: {
                    filePath,
                    fileType,
                    contentType,
                    content,
                    size: typeof content === 'string' ? content.length : JSON.stringify(content).length,
                },
            };
        }

        // Local file system access is restricted in production for security
        return {
            success: false,
            nodeType: 'file-read',
            message: 'Direct local file system access is not permitted in production.',
            output: {
                error: 'Restricted access',
                help: 'Please provide a public URL (http/https) to read file content or use a cloud storage integration like Google Drive.'
            },
        };
    } catch (error) {
        console.error('[DataStorageNodes:file-read] Error:', error);
        return {
            success: false,
            nodeType: 'file-read',
            message: 'Failed to read file',
            output: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}

// ==================== WRITE FILE ====================
export async function executeWriteFile(
    config: DataStorageNodeConfig,
    credentials: Record<string, any>,
    input: any
): Promise<any> {
    const filePath = config.filePath || config.fileName || input?.filePath || '';
    const content = config.content || input?.content || input?.data || '';
    const encoding = config.encoding || 'utf-8';

    if (!filePath) {
        return {
            success: false,
            nodeType: 'file-write',
            message: 'File path required',
            output: { error: 'No file path provided' },
        };
    }

    try {
        // For cloud deployment, we'd write to cloud storage
        // For demo, we'll simulate the write

        const formattedContent = typeof content === 'object'
            ? JSON.stringify(content, null, 2)
            : String(content);

        // In production, this would use:
        // - Google Drive API
        // - AWS S3
        // - Azure Blob Storage
        // - etc.

        return {
            success: false,
            nodeType: 'file-write',
            message: 'Cloud storage provider not configured.',
            output: {
                error: 'No storage provider found',
                help: 'To write files in production, please configure a Cloud Storage provider (AWS S3, Google Cloud Storage) or use the Google Drive node.'
            },
        };
    } catch (error) {
        console.error('[DataStorageNodes:file-write] Error:', error);
        return {
            success: false,
            nodeType: 'file-write',
            message: 'Failed to write file',
            output: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}

// ==================== PARSE JSON ====================
export async function executeParseJSON(
    config: DataStorageNodeConfig,
    credentials: Record<string, any>,
    input: any
): Promise<any> {
    const jsonString = config.jsonString || config.content || input?.text || input?.content || input?.data || '';
    const jsonPath = config.jsonPath || '';

    if (!jsonString) {
        return {
            success: false,
            nodeType: 'json-parse',
            message: 'No JSON data provided',
            output: { error: 'JSON string or data required' },
        };
    }

    try {
        // Parse the JSON
        let parsed: any;
        if (typeof jsonString === 'string') {
            parsed = JSON.parse(jsonString);
        } else {
            parsed = jsonString;
        }

        // Extract using JSONPath if provided
        let extracted = parsed;
        if (jsonPath) {
            const paths = jsonPath.split('.').filter(p => p);
            for (const path of paths) {
                if (extracted && typeof extracted === 'object') {
                    // Handle array notation like [0]
                    const arrayMatch = path.match(/\[(\d+)\]/);
                    if (arrayMatch) {
                        const key = path.replace(/\[\d+\]/, '');
                        const index = parseInt(arrayMatch[1]);
                        extracted = key ? extracted[key]?.[index] : extracted[index];
                    } else {
                        extracted = extracted[path];
                    }
                }
            }
        }

        // Analyze the structure
        const structure = analyzeJSONStructure(parsed);

        return {
            success: true,
            nodeType: 'json-parse',
            label: 'Parse JSON',
            message: 'JSON parsed successfully',
            timestamp: new Date().toISOString(),
            output: {
                parsed,
                extracted: jsonPath ? extracted : undefined,
                jsonPath: jsonPath || undefined,
                structure,
                keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed) : [],
                isArray: Array.isArray(parsed),
                itemCount: Array.isArray(parsed) ? parsed.length : (typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 1),
            },
        };
    } catch (error) {
        console.error('[DataStorageNodes:json-parse] Error:', error);
        return {
            success: false,
            nodeType: 'json-parse',
            message: 'Failed to parse JSON',
            output: {
                error: error instanceof Error ? error.message : 'Invalid JSON format',
                inputPreview: typeof jsonString === 'string'
                    ? jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : '')
                    : 'Non-string input',
            },
        };
    }
}

// Helper function to analyze JSON structure
function analyzeJSONStructure(obj: any, depth = 0, maxDepth = 3): any {
    if (depth > maxDepth) return '...';

    if (Array.isArray(obj)) {
        return {
            type: 'array',
            length: obj.length,
            itemType: obj.length > 0 ? typeof obj[0] : 'unknown',
            sample: obj.length > 0 ? analyzeJSONStructure(obj[0], depth + 1, maxDepth) : null,
        };
    }

    if (obj !== null && typeof obj === 'object') {
        const structure: Record<string, any> = { type: 'object', keys: {} };
        for (const [key, value] of Object.entries(obj).slice(0, 10)) {
            structure.keys[key] = {
                type: Array.isArray(value) ? 'array' : typeof value,
                ...(depth < maxDepth - 1 && typeof value === 'object' && value !== null
                    ? { structure: analyzeJSONStructure(value, depth + 1, maxDepth) }
                    : {}),
            };
        }
        return structure;
    }

    return { type: typeof obj, value: String(obj).substring(0, 50) };
}

// ==================== TRANSFORM DATA ====================
export async function executeTransformData(
    config: DataStorageNodeConfig & { transformType?: string; transformations?: any[] },
    credentials: Record<string, any>,
    input: any
): Promise<any> {
    const data = input?.data || input?.items || config.data || [];
    const transformType = config.action || 'map';
    const transformations = config.transformations || [];

    try {
        let transformed = Array.isArray(data) ? [...data] : [data];

        switch (transformType) {
            case 'map':
            case 'transform':
                // Apply field transformations
                if (transformations.length > 0) {
                    transformed = transformed.map(item => {
                        const newItem = { ...item };
                        for (const t of transformations) {
                            if (t.sourceField && t.targetField) {
                                newItem[t.targetField] = item[t.sourceField];
                            }
                            if (t.operation === 'uppercase' && t.field) {
                                newItem[t.field] = String(item[t.field] || '').toUpperCase();
                            }
                            if (t.operation === 'lowercase' && t.field) {
                                newItem[t.field] = String(item[t.field] || '').toLowerCase();
                            }
                        }
                        return newItem;
                    });
                }
                break;

            case 'flatten':
                // Flatten nested arrays
                transformed = transformed.flat(2);
                break;

            case 'unique':
            case 'deduplicate':
                // Remove duplicates
                transformed = [...new Set(transformed.map(i => JSON.stringify(i)))].map(i => JSON.parse(i));
                break;

            case 'sort':
                // Sort by first object key or value
                transformed.sort((a, b) => {
                    if (typeof a === 'object' && a !== null) {
                        const key = Object.keys(a)[0];
                        return String(a[key]).localeCompare(String(b[key]));
                    }
                    return String(a).localeCompare(String(b));
                });
                break;

            case 'reverse':
                transformed.reverse();
                break;

            case 'group':
                // Group by a field
                const groupField = transformations[0]?.field || 'type';
                const grouped: Record<string, any[]> = {};
                for (const item of transformed) {
                    const key = item[groupField] || 'other';
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(item);
                }
                transformed = [grouped] as any;
                break;
        }

        return {
            success: true,
            nodeType: 'transform',
            label: 'Transform Data',
            message: `Data transformed using ${transformType}`,
            timestamp: new Date().toISOString(),
            output: {
                transformType,
                inputCount: Array.isArray(data) ? data.length : 1,
                outputCount: Array.isArray(transformed) ? transformed.length : 1,
                transformed,
                transformations: transformations.length > 0 ? transformations : undefined,
            },
        };
    } catch (error) {
        console.error('[DataStorageNodes:transform] Error:', error);
        return {
            success: false,
            nodeType: 'transform',
            message: 'Data transformation failed',
            output: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}

// ==================== SPLIT WORKFLOW ====================
export async function executeSplit(
    config: DataStorageNodeConfig & { branches?: number; condition?: string },
    input: any
): Promise<any> {
    const branches = config.branches || 2;
    const data = input?.data || input?.items || [];

    // Split data into branches
    const splitData: any[][] = Array.from({ length: branches }, () => []);

    if (Array.isArray(data) && data.length > 0) {
        data.forEach((item, index) => {
            splitData[index % branches].push(item);
        });
    }

    return {
        success: true,
        nodeType: 'split',
        label: 'Split Workflow',
        message: `Workflow split into ${branches} branches`,
        timestamp: new Date().toISOString(),
        output: {
            branches,
            branchData: splitData,
            totalItems: Array.isArray(data) ? data.length : 0,
            itemsPerBranch: splitData.map(b => b.length),
        },
    };
}

// ==================== MERGE BRANCHES ====================
export async function executeMerge(
    config: DataStorageNodeConfig & { mergeType?: string },
    input: any,
    context: any
): Promise<any> {
    const mergeType = config.action || 'concat';
    const previousResults = context?.previousResults || [];

    // Gather all outputs from previous nodes
    const allData: any[] = [];

    for (const result of previousResults) {
        if (result?.output?.data) allData.push(result.output.data);
        if (result?.output?.items) allData.push(...result.output.items);
        if (result?.output?.branchData) allData.push(...result.output.branchData);
    }

    // Also include direct input
    if (input?.data) allData.push(input.data);
    if (input?.items) allData.push(...input.items);

    let merged: any;

    switch (mergeType) {
        case 'concat':
        case 'combine':
            merged = allData.flat();
            break;
        case 'merge_objects':
            merged = Object.assign({}, ...allData.filter(d => typeof d === 'object' && !Array.isArray(d)));
            break;
        case 'first':
            merged = allData[0];
            break;
        case 'last':
            merged = allData[allData.length - 1];
            break;
        default:
            merged = allData;
    }

    return {
        success: true,
        nodeType: 'merge',
        label: 'Merge Branches',
        message: `Branches merged using ${mergeType}`,
        timestamp: new Date().toISOString(),
        output: {
            mergeType,
            inputCount: allData.length,
            merged,
            mergedItemCount: Array.isArray(merged) ? merged.length : 1,
        },
    };
}
