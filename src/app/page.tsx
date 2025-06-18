import { Card, CardContent } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ChatWindow from "@/components/ui/windows/chatWindow";
import HistoryWindow from "@/components/ui/windows/historyWindow";
import VisualizationWindow from "@/components/ui/windows/visualizationWindow";

export default function HomePage() {
  return (
    <div className="h-full w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={30}>
          <div className="flex h-full items-center justify-center p-2">
            <Card className="h-full w-full">
                <CardContent className="h-full w-full">
                    <ChatWindow />
                </CardContent>
            </Card>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={70}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={75}>
              <div className="flex h-full items-center justify-center p-2">
                <Card className="h-full w-full">
                    <CardContent className="h-full w-full">
                        <VisualizationWindow />
                    </CardContent>
                </Card>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={25}>
              <div className="flex h-full items-center justify-center p-2">
                <Card className="h-full w-full">
                    <CardContent className="h-full w-full">
                        <HistoryWindow />
                    </CardContent>
                </Card>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}