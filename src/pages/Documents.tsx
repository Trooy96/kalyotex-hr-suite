import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Upload,
  Search,
  Download,
  Trash2,
  File,
  FileImage,
  FileSpreadsheet,
  FolderOpen,
  Grid3X3,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  document_category: string | null;
  is_public: boolean | null;
  uploaded_at: string;
  assigned_to: string | null;
  owner: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  assigned_employee: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const categoryColors: Record<string, string> = {
  contract: "bg-primary/10 text-primary",
  policy: "bg-info/10 text-info",
  report: "bg-success/10 text-success",
  template: "bg-warning/10 text-warning",
  other: "bg-muted text-muted-foreground",
};

const fileIcons: Record<string, React.ComponentType<any>> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  default: File,
};

export default function Documents() {
  const { user, loading: authLoading } = useRequireAuth();
  const { isAdmin, isManager } = useUserRole();
  const canManage = isAdmin || isManager;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [stats, setStats] = useState({ total: 0, contracts: 0, policies: 0, reports: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({
    name: "",
    description: "",
    category: "other",
    is_public: false,
    assigned_to: "",
    file: null as File | null,
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    const [docsRes, contractsRes, policiesRes, reportsRes, empRes] = await Promise.all([
      supabase
        .from("documents")
        .select(`
          id, name, description, file_path, file_type, file_size, document_category, is_public, uploaded_at, assigned_to,
          owner:profiles!documents_owner_id_fkey(first_name, last_name),
          assigned_employee:profiles!documents_assigned_to_fkey(first_name, last_name)
        `)
        .order("uploaded_at", { ascending: false }),
      supabase.from("documents").select("id", { count: "exact" }).eq("document_category", "contract"),
      supabase.from("documents").select("id", { count: "exact" }).eq("document_category", "policy"),
      supabase.from("documents").select("id", { count: "exact" }).eq("document_category", "report"),
      supabase.from("profiles").select("id, first_name, last_name"),
    ]);

    if (docsRes.data) setDocuments(docsRes.data as Document[]);
    if (empRes.data) setEmployees(empRes.data);
    setStats({
      total: docsRes.data?.length || 0,
      contracts: contractsRes.count || 0,
      policies: policiesRes.count || 0,
      reports: reportsRes.count || 0,
    });
    setLoading(false);
  }

  async function handleUpload() {
    if (!newDoc.file || !newDoc.name) {
      toast({ title: "Error", description: "Please provide a file and name", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const fileExt = newDoc.file.name.split(".").pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, newDoc.file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("documents").insert({
        name: newDoc.name,
        description: newDoc.description || null,
        file_path: fileName,
        file_type: fileExt || null,
        file_size: newDoc.file.size,
        document_category: newDoc.category,
        is_public: newDoc.is_public,
        owner_id: profile.id,
        assigned_to: newDoc.assigned_to || null,
      });

      if (dbError) throw dbError;

      toast({ title: "Success", description: "Document uploaded successfully" });
      setDialogOpen(false);
      setNewDoc({ name: "", description: "", category: "other", is_public: false, assigned_to: "", file: null });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: Document) {
    try {
      await supabase.storage.from("documents").remove([doc.file_path]);
      await supabase.from("documents").delete().eq("id", doc.id);
      toast({ title: "Success", description: "Document deleted" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }

  async function handleDownload(doc: Document) {
    const { data } = await supabase.storage.from("documents").download(doc.file_path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || doc.document_category === category;
    return matchesSearch && matchesCategory;
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout title="Documents" subtitle="Manage company documents">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-info/10">
              <FileText className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.contracts}</p>
              <p className="text-sm text-muted-foreground">Contracts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.policies}</p>
              <p className="text-sm text-muted-foreground">Policies</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <FileSpreadsheet className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.reports}</p>
              <p className="text-sm text-muted-foreground">Reports</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">All Documents</CardTitle>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="contract">Contracts</SelectItem>
                <SelectItem value="policy">Policies</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded-lg border border-input overflow-hidden">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setView("grid")}
                className="rounded-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setView("list")}
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>Upload a document and optionally assign it to an employee</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewDoc({ ...newDoc, file, name: newDoc.name || file.name });
                        }
                      }}
                    />
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    {newDoc.file ? (
                      <p className="text-sm font-medium">{newDoc.file.name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click to select a file</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Document Name *</Label>
                    <Input
                      value={newDoc.name}
                      onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                      placeholder="Enter document name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={newDoc.category} onValueChange={(v) => setNewDoc({ ...newDoc, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                        <SelectItem value="template">Template</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {canManage && (
                    <div className="space-y-2">
                      <Label>Assign to Employee</Label>
                      <Select value={newDoc.assigned_to} onValueChange={(v) => setNewDoc({ ...newDoc, assigned_to: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.first_name} {emp.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Only the assigned employee will be able to view this document
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newDoc.description}
                      onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                      placeholder="Optional description..."
                      rows={2}
                    />
                  </div>
                  <Button className="w-full" variant="gradient" onClick={handleUpload} disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload Document"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredDocs.map((doc, index) => {
                const ext = doc.file_type?.toLowerCase() || "default";
                const IconComponent = fileIcons[ext] || fileIcons.default;
                const categoryColor = categoryColors[doc.document_category || "other"];

                return (
                  <Card
                    key={doc.id}
                    className="glass-card hover:shadow-card-hover transition-all duration-300 animate-slide-up group"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 rounded-xl bg-muted">
                          <IconComponent className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}>
                            <Download className="w-4 h-4" />
                          </Button>
                          {canManage && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <h4 className="font-medium truncate mb-1">{doc.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {formatFileSize(doc.file_size)} • {format(new Date(doc.uploaded_at), "MMM d, yyyy")}
                      </p>
                      {doc.assigned_employee && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Assigned to: {doc.assigned_employee.first_name} {doc.assigned_employee.last_name}
                        </p>
                      )}
                      <Badge variant="secondary" className={cn("text-xs capitalize", categoryColor)}>
                        {doc.document_category || "other"}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Assigned To</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Size</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Uploaded</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc, index) => {
                    const ext = doc.file_type?.toLowerCase() || "default";
                    const IconComponent = fileIcons[ext] || fileIcons.default;
                    const categoryColor = categoryColors[doc.document_category || "other"];

                    return (
                      <tr
                        key={doc.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 20}ms` }}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium">{doc.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className={cn("text-xs capitalize", categoryColor)}>
                            {doc.document_category || "other"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {doc.assigned_employee
                            ? `${doc.assigned_employee.first_name} ${doc.assigned_employee.last_name}`
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {format(new Date(doc.uploaded_at), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            {canManage && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {filteredDocs.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              No documents found
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
