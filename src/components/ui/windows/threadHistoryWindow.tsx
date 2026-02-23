"use client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { SquarePen, Search, X, Pencil, Pin} from "lucide-react";
import { use, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/field";
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,AlertDialogTrigger} from "@/components/ui/alert-dialog"
 
export function SideMenu() {
  const {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  } = useSidebar();
  
    const [threads, setThreads] = useState(
      Array.from({ length: 1 }, (_, i) => ({
        id: i + 1,
        name: `My Test Thread ${i + 1}`
        // In a real application, you would fetch this data from an API or database
      }))
    );
    const [openId, setOpenId] = useState<number | null>(null);
    const deleteThread = (id:number) => {
      setThreads(prev => prev.filter(thread => thread.id !== id));
    };
  const renameThread = (id:number, newName:string) => {
  if (!newName) return;
 
  setThreads(prev =>
    prev.map(thread =>
      thread.id === id
        ? { ...thread, name: newName }
        : thread
    )
  );
};
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="pt-30"/>
            
      {/* <span className="ml-2 hidden sm:inline">Hello from the side menu!</span> */}
      <SidebarContent>
        <SidebarGroup >
          <SidebarTrigger />
        </SidebarGroup>
        {/* <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <div className="text-sidebar-foreground/70 text-xs">
          </div>
        </SidebarGroup> */}
        <SidebarGroup>
          <Dialog
            // open={openId === thread.id}
            // onOpenChange={(open) => setOpenId(open ? thread.id : null)}
          >
            <DialogTrigger asChild>
              <SidebarMenuButton
                variant="outline"
                className="w-full flex items-center justify-center md:justify-start"
              
              >
                <SquarePen className="w-4 h-4 group-hover:text-primary" />
                <span className="ml-2">New Thread</span>
              </SidebarMenuButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <form
                onSubmit={(e) => {
                  const newThreadId = threads.length > 0 ? threads[threads.length - 1].id + 1 : 1;
                  const newThread = { id: newThreadId, name: `New Thread ${threads.length + 1}` };
                  setThreads(prev => [
                    ...prev,
                    newThread
                  ]);
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem("name") as HTMLInputElement;
                  renameThread(newThreadId, input.value);
                  setOpenId(null);
                }}
              >
                <DialogHeader className="mb-2">
                  <DialogTitle>Rename Conversation Thread</DialogTitle>
                  <DialogDescription>
                    Change the name of your conversation thread. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <Field className="mb-6">
                  <Input
                    name="name"
                    defaultValue={threads[threads.length - 1]?.name || "New Thread"}
                  />
                </Field>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">
                    Save changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <SidebarMenuButton
            variant="outline"
            className="w-full flex items-center justify-center md:justify-start"
          >
            <Search className="w-4 h-4" />
            <span className="ml-2">Search Threads</span>
          </SidebarMenuButton>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <div className="text-sidebar-foreground/70 text-xs truncate">
            Conversation Threads
          </div>
          <div>
            {threads.map((thread) => (
              <SidebarMenuItem key={thread.id}>
                <div className="ml-2 relative group/item flex flex-row items-center rounded-md hover:bg-sidebar-accent cursor-pointer">
                  <SidebarMenuButton
                    onClick={(e) => {
                      e.stopPropagation();
                      // Reloade Conversation here
                    }}
                    className="flex-2">
                    <span className="truncate">{thread.name}</span>
                  </SidebarMenuButton>
                    <Dialog
                      open={openId === thread.id}
                      onOpenChange={(open) => setOpenId(open ? thread.id : null)}
                    >
                      <DialogTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-0 transition-opacity duration-75 group-hover/item:opacity-100 p-1 rounded hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-sm">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const input = e.currentTarget.elements.namedItem("name") as HTMLInputElement;
                            renameThread(thread.id, input.value);
                            setOpenId(null);
                          }}
                        >
                          <DialogHeader className="mb-2">
                            <DialogTitle>Rename Conversation Thread</DialogTitle>
                            <DialogDescription>
                              Change the name of your conversation thread. Click save when you're done.
                            </DialogDescription>
                          </DialogHeader>
                          <Field className="mb-6">
                            <Input
                              name="name"
                              defaultValue={thread.name}
                            />
                          </Field>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button type="button" variant="outline">
                                Cancel
                              </Button>
                            </DialogClose>
                            <Button type="submit">
                              Save changes
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  <div className="flex-1"/>
                    <AlertDialog >
                      <AlertDialogTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Don't trigger row click
                          }}
                          className="
                            absolute right-2 top-1/2 -translate-y-1/2
                            opacity-0
                            transition-opacity duration-75
                            group-hover/item:opacity-100
                            p-1 rounded hover:text-red-600
                          "
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                        onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          deleteThread(thread.id);
                        }
                      }}>
                        <form onSubmit={(e) => {
                          e.preventDefault();  // prevent default form submission
                          deleteThread(thread.id); // your destructive action
                        }}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete Conversation Thread: {thread.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the conversation and graphs from your account
                              from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              asChild
                              variant="destructive"
                              onClick={() => deleteThread(thread.id)}
                            >
                              <button type="submit">Delete</button>
                            </AlertDialogAction>                          
                          </AlertDialogFooter>
                        </form>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </SidebarMenuItem>
              ))}
            </div>
          </SidebarGroup>
        </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}