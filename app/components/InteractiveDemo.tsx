"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReactFlow, {
    Background,
    Controls,
    Handle,
    Position,
    Node,
    Edge,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    MarkerType,
    BackgroundVariant
} from "reactflow";
import "reactflow/dist/style.css";
import {
    Zap,
    Mail,
    CheckCircle2,
    Users,
    Play,
    MousePointer2,
    RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const initialNodes: Node[] = [
    {
        id: "trigger",
        type: "demo",
        data: {
            label: "Form Submitted",
            icon: Zap,
            description: "Google Forms",
            color: "from-purple-500 to-violet-600"
        },
        position: { x: 50, y: 150 },
    },
    {
        id: "action-1",
        type: "demo",
        data: {
            label: "Update Sheets",
            icon: RefreshCw,
            description: "Google Sheets",
            color: "from-green-500 to-emerald-600"
        },
        position: { x: 350, y: 80 },
    },
    {
        id: "action-2",
        type: "demo",
        data: {
            label: "Send WhatsApp",
            icon: Users,
            description: "WhatsApp Web",
            color: "from-emerald-400 to-teal-600"
        },
        position: { x: 350, y: 220 },
    },
    {
        id: "action-3",
        type: "demo",
        data: {
            label: "Notify Parent",
            icon: Mail,
            description: "Gmail / Email",
            color: "from-blue-500 to-indigo-600"
        },
        position: { x: 650, y: 150 },
    }
];

const initialEdges: Edge[] = [
    {
        id: "e1-1",
        source: "trigger",
        target: "action-1",
        animated: true,
        style: { stroke: "#a855f7", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" }
    },
    {
        id: "e1-2",
        source: "trigger",
        target: "action-2",
        animated: true,
        style: { stroke: "#a855f7", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" }
    },
    {
        id: "e2-3",
        source: "action-1",
        target: "action-3",
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" }
    },
    {
        id: "e3-3",
        source: "action-2",
        target: "action-3",
        animated: true,
        style: { stroke: "#14b8a6", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#14b8a6" }
    },
];

const DemoNode = ({ data }: { data: any }) => {
    const Icon = data.icon;
    return (
        <div className="relative min-w-[180px] p-4 rounded-xl bg-card/80 backdrop-blur-md border border-border/50 shadow-xl overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-br ${data.color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`} />

            <Handle type="target" position={Position.Left} className="!bg-muted-foreground/30 !border-none" />

            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${data.color} shadow-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-foreground">{data.label}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{data.description}</p>
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="!bg-muted-foreground/30 !border-none" />
        </div>
    );
};

const nodeTypes = {
    demo: DemoNode,
};

export function InteractiveDemo() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [isRunning, setIsRunning] = useState(false);
    const [activeNode, setActiveNode] = useState<string | null>(null);

    const runSimulation = async () => {
        if (isRunning) return;
        setIsRunning(true);

        const sequence = ["trigger", "action-1", "action-2", "action-3"];

        for (const nodeId of sequence) {
            setActiveNode(nodeId);
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        setActiveNode("complete");
        await new Promise(resolve => setTimeout(resolve, 2000));
        setActiveNode(null);
        setIsRunning(false);
    };

    return (
        <div className="w-full h-full relative group cursor-default">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                preventScrolling={true}
                zoomOnScroll={false}
                panOnScroll={false}
                panOnDrag={false}
                nodesDraggable={false}
                className="bg-transparent"
            >
                <Background color="#888" variant={BackgroundVariant.Dots} gap={20} size={1} />
            </ReactFlow>

            {/* Overlays */}
            <div className="absolute inset-0 pointer-events-none">
                <AnimatePresence>
                    {activeNode && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] flex items-center justify-center"
                        >
                            {activeNode === "complete" ? (
                                <motion.div
                                    className="bg-background/90 p-6 rounded-2xl shadow-2xl border border-primary/20 flex flex-col items-center gap-4"
                                    layoutId="status-card"
                                >
                                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold">Automation Successful</h3>
                                        <p className="text-sm text-muted-foreground">3 parents notified via WhatsApp & Email</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="p-4 bg-background/80 rounded-xl border border-border/50 shadow-xl flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-primary animate-pulse" />
                                    <span className="text-sm font-medium">Processing {activeNode}...</span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Play Button Overlay (Visible when not running) */}
            {!isRunning && activeNode === null && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={runSimulation}
                        className="p-8 bg-primary text-primary-foreground rounded-full shadow-2xl transform transition-all hover:scale-110 active:scale-95 flex items-center justify-center gap-3 group/btn"
                    >
                        <Play className="w-8 h-8 fill-current" />
                        <span className="text-xl font-bold px-2">Run Demo</span>
                        <MousePointer2 className="w-6 h-6 absolute -bottom-8 -right-8 text-primary animate-bounce pointer-events-none opacity-0 group-hover/btn:opacity-100" />
                    </button>
                </div>
            )}
        </div>
    );
}
