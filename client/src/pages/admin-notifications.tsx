import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import kuznexLogo from "@assets/image_1770554564085.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Bell,
  Loader2,
  Trash2,
  ShieldAlert,
  Sparkles,
  Wrench,
  Info,
  Send,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";

const TYPE_OPTIONS = [
  { value: "feature", label: "New Feature", icon: Sparkles, color: "text-blue-500" },
  { value: "security", label: "Security Alert", icon: ShieldAlert, color: "text-red-500" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "text-yellow-500" },
  { value: "general", label: "General Update", icon: Info, color: "text-muted-foreground" },
];

export default function AdminNotifications() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("general");

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/admin/notifications"],
    enabled: !!user?.isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; message: string; type: string }) => {
      const res = await apiRequest("POST", "/api/admin/notifications", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Notification Sent", description: "Broadcast to all users successfully." });
      setTitle("");
      setMessage("");
      setType("general");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/notifications/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Notification removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    createMutation.mutate({ title: title.trim(), message: message.trim(), type });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-[999]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src={kuznexLogo} alt="Kuznex" className="h-8 w-auto" />
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Notification Manager</h1>
        </div>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">Send New Notification</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="notif-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-notification-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <opt.icon className={`w-3.5 h-3.5 ${opt.color}`} />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notif-title">Title</Label>
              <Input
                id="notif-title"
                placeholder="e.g. New Feature: Portfolio Analytics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                data-testid="input-notification-title"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notif-message">Message</Label>
              <textarea
                id="notif-message"
                placeholder="Describe the update, security alert, or maintenance details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                data-testid="textarea-notification-message"
              />
              <span className="text-xs text-muted-foreground">{message.length}/2000</span>
            </div>

            <Button type="submit" disabled={createMutation.isPending || !title.trim() || !message.trim()} data-testid="button-send-notification">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Broadcast to All Users
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">Sent Notifications ({notifications.length})</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No notifications sent yet.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const typeOpt = TYPE_OPTIONS.find(t => t.value === notif.type) || TYPE_OPTIONS[3];
                const Icon = typeOpt.icon;
                return (
                  <div key={notif.id} className="flex items-start gap-3 p-3 rounded-md border border-border" data-testid={`notification-sent-${notif.id}`}>
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${typeOpt.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{notif.title}</span>
                        <Badge variant="secondary" className="text-[10px]">{typeOpt.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        {new Date(notif.created_at).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(notif.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-notification-${notif.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
