import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Mail,
  MailOpen,
  Archive,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { ContactMessage } from "@shared/schema";
import kuznexLogo from "@assets/image_1770554564085.png";

export default function AdminMessages() {
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const { data: messages, isLoading } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/messages"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/messages/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      toast({ title: "Message status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredMessages = messages?.filter((m) =>
    filter === "all" ? true : m.status === filter
  ) || [];

  const statusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="default" data-testid={`badge-status-new`}>New</Badge>;
      case "replied":
        return <Badge variant="secondary" data-testid={`badge-status-replied`}>Replied</Badge>;
      case "archived":
        return <Badge variant="outline" data-testid={`badge-status-archived`}>Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <img src={kuznexLogo} alt="Kuznex" className="h-7 w-auto cursor-pointer" />
            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">Support Messages</span>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-messages-heading">
            Support Messages
          </h1>
          <div className="flex items-center gap-2">
            {["all", "new", "replied", "archived"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                data-testid={`button-filter-${f}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <Card className="p-10 text-center">
            <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground" data-testid="text-no-messages">No messages found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg) => (
              <Card key={msg.id} className="overflow-visible" data-testid={`card-message-${msg.id}`}>
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                  data-testid={`button-expand-${msg.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-medium text-foreground text-sm" data-testid={`text-name-${msg.id}`}>
                          {msg.name}
                        </span>
                        {statusBadge(msg.status)}
                        <Badge variant="outline">{msg.subject}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground" data-testid={`text-email-${msg.id}`}>
                        {msg.email} &middot; {new Date(msg.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {expandedId === msg.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </div>

                {expandedId === msg.id && (
                  <div className="px-5 pb-5 pt-0 border-t border-border/50">
                    <p className="text-sm text-foreground leading-relaxed mt-4 mb-5 whitespace-pre-wrap" data-testid={`text-message-${msg.id}`}>
                      {msg.message}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <a href={`mailto:${msg.email}?subject=Re: ${msg.subject} - Kuznex Support`}>
                        <Button size="sm" data-testid={`button-reply-${msg.id}`}>
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Reply via Email
                        </Button>
                      </a>
                      {msg.status !== "replied" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatusMutation.mutate({ id: msg.id, status: "replied" });
                          }}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-mark-replied-${msg.id}`}
                        >
                          <MailOpen className="w-3.5 h-3.5 mr-1.5" />
                          Mark Replied
                        </Button>
                      )}
                      {msg.status !== "archived" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatusMutation.mutate({ id: msg.id, status: "archived" });
                          }}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-archive-${msg.id}`}
                        >
                          <Archive className="w-3.5 h-3.5 mr-1.5" />
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
