import { useState } from "react";
import { Calendar, Plus, Upload, History, LogOut, User, Home, Settings, Baby } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const menuItems = [
  { title: "Medication Overview", url: "/overview", icon: Home },
  { title: "New Med Entry", url: "/add-medication", icon: Plus },
  { title: "AI Image Analysis", url: "/upload-ocr", icon: Upload },
  { title: "Medication History", url: "/history", icon: History },
  { title: "Add Child", url: "/profile?addChild=1", icon: Baby },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-border/40 bg-background">
        <div className="flex items-center justify-center px-4 py-4">
          {!isCollapsed ? (
            <img 
              src="/NaviKinder - format logo.png" 
              alt="NaviKinder Healthcare" 
              className="h-16 w-full object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
              <img 
                src="/navikinder-logo-192.png" 
                alt="Navikinder Logo" 
                className="h-8 w-8 object-contain"
              />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-background">
        <SidebarGroup className="px-3 py-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="space-y-1">
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-11">
                      <NavLink 
                        to={item.url} 
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200
                          ${active 
                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }
                        `}
                      >
                        <item.icon className={`h-5 w-5 ${active ? 'text-primary' : ''}`} />
                        {!isCollapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isCollapsed && <Separator className="mx-3" />}

        {/* Account Section */}
        <SidebarGroup className="px-3 py-4">
          {!isCollapsed && (
            <SidebarGroupLabel className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Account
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="space-y-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-11">
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    {!isCollapsed && <span>Sign Out</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - User Profile */}
      <SidebarFooter className="border-t border-border/40 bg-background">
        {user && (
          <div className="p-3">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}