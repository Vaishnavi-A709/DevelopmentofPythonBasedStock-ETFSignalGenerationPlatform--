import { useState } from "react";
import { Search, Bell, Menu, Settings, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import LiveClock from "@/components/ui/LiveClock";

interface TopNavbarProps {
  onMenuToggle?: () => void;
}

const notifications = [
  { id: 1, title: "AAPL Buy Signal", desc: "Confidence 92% — triggered 2m ago", unread: true },
  { id: 2, title: "Portfolio alert", desc: "Daily return exceeded +3%", unread: true },
  { id: 3, title: "TSLA crossover", desc: "Golden cross detected on 1D chart", unread: false },
];

export default function TopNavbar({ onMenuToggle }: TopNavbarProps) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const userName = localStorage.getItem("userName") || "User";
  const userEmail = localStorage.getItem("userEmail") || "";
  const userInitials = userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleNotificationClick = (title: string) => {
    toast.info(`Opened: ${title}`);
  };

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground hover:text-foreground shrink-0"
        onClick={onMenuToggle}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search stock..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 md:h-10 text-sm"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <LiveClock />

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground h-9 w-9">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 border-b border-border">
              <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n.title)}
                  className="w-full text-left px-3 py-2.5 hover:bg-secondary/50 transition-colors flex items-start gap-2"
                >
                  {n.unread && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  <div className={n.unread ? "" : "ml-3.5"}>
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
              <Settings className="w-4 h-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-loss focus:text-loss">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
