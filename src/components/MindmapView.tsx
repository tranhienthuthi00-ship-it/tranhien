import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Trash2 } from 'lucide-react';

interface MindmapViewProps {
  nodes: Node[];
  edges: Edge[];
  onChange: (nodes: Node[], edges: Edge[]) => void;
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    data: { label: 'Chủ đề chính' },
    position: { x: 250, y: 250 },
    style: {
      background: '#fff',
      border: '2px solid #141414',
      borderRadius: '8px',
      padding: '10px 20px',
      fontWeight: 'bold',
      boxShadow: '4px 4px 0px #141414'
    }
  }
];

const initialEdges: Edge[] = [];

export function MindmapView({ nodes: propNodes, edges: propEdges, onChange }: MindmapViewProps) {
  const [nodes, setNodes] = useState<Node[]>(propNodes?.length > 0 ? propNodes : initialNodes);
  const [edges, setEdges] = useState<Edge[]>(propEdges || initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const nextNodes = applyNodeChanges(changes, nodes);
      setNodes(nextNodes);
      onChange(nextNodes, edges);
    },
    [nodes, edges, onChange]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const nextEdges = applyEdgeChanges(changes, edges);
      setEdges(nextEdges);
      onChange(nodes, nextEdges);
    },
    [nodes, edges, onChange]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const nextEdges = addEdge(params, edges);
      setEdges(nextEdges);
      onChange(nodes, nextEdges);
    },
    [nodes, edges, onChange]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleAddNode = () => {
    if (!selectedNode) return;
    const newNode: Node = {
      id: Date.now().toString(),
      data: { label: 'Nhánh mới' },
      position: { x: selectedNode.position.x + 200, y: selectedNode.position.y + (Math.random() * 100 - 50) },
      style: {
        background: '#fff',
        border: '2px solid #141414',
        borderRadius: '8px',
        padding: '8px 16px',
        fontWeight: 'bold',
        boxShadow: '2px 2px 0px #141414'
      }
    };
    const newEdge: Edge = {
      id: `e${selectedNode.id}-${newNode.id}`,
      source: selectedNode.id,
      target: newNode.id,
      style: { stroke: '#141414', strokeWidth: 2 }
    };

    const nextNodes = [...nodes, newNode];
    const nextEdges = [...edges, newEdge];
    setNodes(nextNodes);
    setEdges(nextEdges);
    onChange(nextNodes, nextEdges);
  };

  const handleUpdateLabel = (label: string) => {
    if (!selectedNode) return;
    const nextNodes = nodes.map((n) => {
      if (n.id === selectedNode.id) {
        return { ...n, data: { ...n.data, label } };
      }
      return n;
    });
    setNodes(nextNodes);
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label } });
    onChange(nextNodes, edges);
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    const nextNodes = nodes.filter((n) => n.id !== selectedNode.id);
    const nextEdges = edges.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id);
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNode(null);
    onChange(nextNodes, nextEdges);
  };

  return (
    <div className="w-full h-[500px] border-2 border-ink rounded-xl overflow-hidden bg-[#FFFDF5] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
      >
        <Background />
        <Controls />
        {selectedNode && (
          <Panel position="top-right" className="bg-white p-3 rounded-xl border-2 border-ink shadow-[4px_4px_0px_#141414] m-4 flex flex-col gap-2 z-50">
            <h4 className="text-xs font-black uppercase text-ink">Chỉnh sửa nhánh</h4>
            <input
              type="text"
              value={selectedNode.data.label as string}
              onChange={(e) => handleUpdateLabel(e.target.value)}
              className="px-2 py-1.5 text-sm font-bold border-2 border-ink/20 rounded-md focus:border-amber-500 focus:outline-none"
              placeholder="Tên nhánh"
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleAddNode}
                className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg border border-amber-300 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm con
              </button>
              <button
                onClick={handleDeleteNode}
                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg border border-rose-200 flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
