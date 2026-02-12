import { WaveAsset } from "@/components/ui/Assets/wave-asset";
import { Card, CardContent } from "@/components/ui/card";
import { RobotIcon } from "@/components/ui/Icons/robot-icon";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import AlternateHistoryWindow from "@/components/ui/windows/alternateHistoryWindow";
import ChatWindow from "@/components/ui/windows/chatWindow";
import HistoryWindow from "@/components/ui/windows/historyWindow";
import VisualizationWindow from "@/components/ui/windows/visualizationWindow";
import { t } from "i18next";

export default function HomePage() {
  return (
    <div className="h-full w-full p-4">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={30} minSize={15} collapsible>
          <div className="flex-auto h-full items-center justify-center pr-1 p-2">
            <Card className="h-full w-full py-0  overflow-hidden">
              {/* See what happens */}
              <div className="gap-0 " >  
              <div className="w-full h-15 rounded-t-xl z-10 flex items-center justify-between px-10 bg-gradient-to-tl from-secondary to-primary">
                  <div className="flex w-full gap-[8px] items-center ">
                      <p className="text-background font-semibold">Chat with the me</p><RobotIcon className="w-6 h-6" />
                  </div>
              </div>
              <WaveAsset className="w-full fill-gradient-to-r from-primary to-accent" />
              </div>
                <CardContent className="h-full w-full ">
                    <ChatWindow />
                </CardContent>
            </Card>
          </div>
        </ResizablePanel>
        <ResizableHandle className="min-w-1 bg-transparent" />
        <ResizablePanel defaultSize={70} minSize={15} collapsible>
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={75} minSize={15} collapsible>
              <div className="flex h-full items-center justify-center pl-1 pb-1 p-2">
                <Card className="h-full w-full">
                      <CardContent className="h-full w-full">
                        <VisualizationWindow />
                    </CardContent>
                </Card>
              </div>
            </ResizablePanel>
            <ResizableHandle className="min-h-1 bg-transparent" />
            <ResizablePanel defaultSize={25} minSize={15} collapsible>
              <div className="flex h-full items-center justify-center p-2">
                <Card className="h-full w-full p-0">
                    <CardContent className="h-full w-full p-2">
                        {/* <HistoryWindow /> */}
                        <AlternateHistoryWindow />
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

{/* <div className="w-full h-[50px] rounded-t-[15px] z-10 flex items-center justify-between px-[20px] bg-gradient-to-tl from-secondary to-primary">
                <div className="flex w-full gap-[8px] items-center">
                    <p className="text-background font">Chat with the me</p>
                    <RobotIcon width={24} height={24} />
                </div>
                {
                    userIsAdmin &&
                    <Select value={currentConversationId} placeholder="Select a conversation:" options={conversationIdsList.map(cId => ({ label: cId, value: cId }))} onChange={setCurrentConversation} onChangeHandleValueChange={true} />
                }
            </div> */}