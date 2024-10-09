"use client";

import React, { useState, useRef, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2, Power, Play, Zap, Code, Terminal } from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";

interface Cell {
  id: string;
  code: string;
  output: string;
  consoleOutput: string;
  isActive: boolean;
}

export default function Notebook() {
  const [cells, setCells] = useState<Cell[]>([
    {
      id: "1",
      code: "let x = 5;",
      output: "",
      consoleOutput: "",
      isActive: true,
    },
    {
      id: "2",
      code: "console.log(x);",
      output: "",
      consoleOutput: "",
      isActive: true,
    },
  ]);
  const endOfListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfListRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cells.length]);

  const handleEditorChange = (value: string | undefined, cellId: string) => {
    setCells(
      cells.map((cell) =>
        cell.id === cellId ? { ...cell, code: value || "" } : cell
      )
    );
  };

  const executeCode = (cellId: string, isIsolated: boolean) => {
    let accumulatedCode = "";
    let targetCellIndex = cells.findIndex((cell) => cell.id === cellId);

    setCells(
      cells.map((cell, index) => {
        if (!isIsolated && cell.isActive && index <= targetCellIndex) {
          accumulatedCode += cell.code + "\n";
        }

        if (
          cell.id === cellId ||
          (!isIsolated && cell.isActive && index <= targetCellIndex)
        ) {
          let output = "";
          let consoleOutput = "";
          const originalConsoleLog = console.log;
          const logs: string[] = [];

          console.log = (...args) => {
            logs.push(args.map((arg) => String(arg)).join(" "));
          };

          try {
            const result = eval(isIsolated ? cell.code : accumulatedCode);
            output = String(result);
          } catch (error) {
            output = `Error: ${String(error)}`;
          } finally {
            console.log = originalConsoleLog;
            consoleOutput = logs.join("\n");
          }

          return { ...cell, output, consoleOutput };
        }
        return cell;
      })
    );
  };

  const addCell = () => {
    const newCell: Cell = {
      id: Date.now().toString(),
      code: "",
      output: "",
      consoleOutput: "",
      isActive: true,
    };
    setCells([...cells, newCell]);
  };

  const deleteCell = (cellId: string) => {
    setCells(cells.filter((cell) => cell.id !== cellId));
  };

  const toggleCell = (cellId: string) => {
    setCells(
      cells.map((cell) =>
        cell.id === cellId ? { ...cell, isActive: !cell.isActive } : cell
      )
    );
  };

  //   Result Highlighting
  useEffect(() => {
    Prism.highlightAll();
  }, [cells]);

  const formatOutput = (output: string) => {
    try {
      // Attempt to parse the output as JSON for better formatting
      const parsedOutput = JSON.parse(output);
      return JSON.stringify(parsedOutput, null, 2);
    } catch {
      // If it's not valid JSON, return the original string
      return output;
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
        <nav className="sticky top-4 z-50 flex justify-between items-center mb-6 p-4 bg-white rounded-lg border">
          <h1 className="text-2xl font-bold text-primary">
            JavaScriptLab Notebook
          </h1>
          <Button onClick={addCell} size="sm">
            <Plus className="w-4 h-4 mr-2" /> New Cell
          </Button>
        </nav>
        <div className="space-y-4 max-w-4xl mx-auto">
          {cells.map((cell) => (
            <Card
              key={cell.id}
              className="overflow-hidden shadow-none transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex">
                  <div className="flex-grow">
                    <div
                      className={`transition-opacity duration-200 ${
                        cell.isActive ? "opacity-100" : "opacity-50"
                      }`}>
                      <div className="h-[150px] border rounded-md mb-3 overflow-hidden">
                        <Editor
                          height="100%"
                          defaultLanguage="javascript"
                          value={cell.code}
                          onChange={(value) =>
                            handleEditorChange(value, cell.id)
                          }
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            lineNumbers: "on",
                            fontSize: 14,
                            fontFamily: "Fira Code, monospace",
                          }}
                        />
                      </div>
                      {(cell.output || cell.consoleOutput) && (
                        <div className="text-sm space-y-2">
                          {cell.output && (
                            <div className="bg-gray-800 p-3 rounded-md">
                              <div className="flex items-center text-gray-300 mb-1">
                                <Code className="w-4 h-4 mr-2" />
                                <strong>Output:</strong>
                              </div>
                              <pre className="font-mono text-sm">
                                <code className="language-javascript">
                                  {formatOutput(cell.output)}
                                </code>
                              </pre>
                            </div>
                          )}
                          {cell.consoleOutput && (
                            <div className="bg-gray-800 p-3 rounded-md">
                              <div className="flex items-center text-gray-300 mb-1">
                                <Terminal className="w-4 h-4 mr-2" />
                                <strong>Console:</strong>
                              </div>
                              <pre className="font-mono text-sm">
                                <code className="language-javascript">
                                  {cell.consoleOutput}
                                </code>
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center space-y-2 ml-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => executeCode(cell.id, false)}
                          size="sm"
                          variant="default"
                          className="">
                          <Play className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Run with context</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => executeCode(cell.id, true)}
                          size="sm"
                          variant="ghost"
                          className="text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100">
                          <Zap className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Run isolated</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => deleteCell(cell.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete cell</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => toggleCell(cell.id)}
                          size="sm"
                          variant="ghost"
                          className={
                            cell.isActive
                              ? "text-green-500 hover:text-green-700 hover:bg-green-100"
                              : "text-red-500 hover:text-red-700 hover:bg-red-100"
                          }>
                          <Power className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {cell.isActive ? "Deactivate" : "Activate"} cell
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div ref={endOfListRef} />
      </div>
    </TooltipProvider>
  );
}
