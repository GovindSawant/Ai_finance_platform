"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, File, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { scanBankPdf } from "@/actions/transaction";
import { toast } from "sonner";

interface Transaction {
    date: Date;
    amount: number;
    description: string;
    category: string;
}

interface Account {
    id: string;
    name: string;
}

interface BankStatementUploadProps {
    onUploadComplete?: (transactions: Transaction[]) => void;
    accounts: Account[];
}

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function BankStatementUpload({ onUploadComplete, accounts }: BankStatementUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [accountId, setAccountId] = useState<string>("");
    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setFile(null);
        setUploadStatus("idle");
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setDragActive(true);
        }
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    }, []);

    const handleFileSelect = (selectedFile: File) => {
        if (selectedFile.type === "application/pdf" || selectedFile.type.startsWith("image/")) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError("File must be smaller than 5MB");
                return;
            }
            setFile(selectedFile);
            setError(null);
        } else {
            setError("Please select a PDF or Image file");
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) handleFileSelect(selectedFile);
    };

    const uploadFile = async () => {
        if (!file) return;
        if (!accountId) {
            toast.error("Please select an account first");
            return;
        }

        setUploadStatus("uploading");
        setError(null);

        try {
            const result = await scanBankPdf(file, accountId);

            if (result.success && result.data) {
                setUploadStatus("success");
                onUploadComplete(result.data.map((t: any) => ({
                    ...t,
                    date: new Date(t.date)
                })));
                toast.success("Transactions extracted successfully");

                setTimeout(() => {
                    resetState();
                }, 3000);
            } else {
                throw new Error("Upload failed");
            }
        } catch (err) {
            setUploadStatus("error");
            const msg = err instanceof Error ? err.message : "Failed to upload/scan file";
            setError(msg);
            toast.error(msg);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 border rounded-lg bg-white dark:bg-gray-900 shadow-sm">
            <div className="space-y-4">
                {/* Account Selection */}
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                    <label className="text-sm font-medium mb-1 block">Select Account for Statement</label>
                    <Select value={accountId} onValueChange={setAccountId}>
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent className="">
                            {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id} className="">
                                    {account.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Drop Zone */}
                <div
                    className={cn(
                        "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
                        dragActive ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600",
                        uploadStatus === "success" && "border-green-400 bg-green-50 dark:bg-green-900/20",
                        uploadStatus === "error" && "border-red-400 bg-red-50 dark:bg-red-900/20"
                    )}
                    onDragEnter={handleDragIn}
                    onDragLeave={handleDragOut}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center space-y-3">
                        {uploadStatus === "uploading" ? (
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        ) : uploadStatus === "success" ? (
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        ) : uploadStatus === "error" ? (
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        ) : (
                            <Upload className="w-10 h-10 text-gray-400" />
                        )}

                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {uploadStatus === "uploading" ? "Scanning document..." :
                                uploadStatus === "success" ? "Upload complete!" :
                                    uploadStatus === "error" ? "Upload failed" :
                                        "Drag & drop PDF or Image, or click to select"}
                        </p>
                    </div>
                </div>

                {/* Selected File & Action */}
                {file && uploadStatus === "idle" && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex items-center space-x-3">
                            <File className="w-5 h-5 text-blue-500" />
                            <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); uploadFile(); }}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                                Scan
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); resetState(); }}
                                className="p-1.5 text-gray-500 hover:text-red-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            </div>
        </div>
    );
}
