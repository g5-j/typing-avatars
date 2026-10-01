import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import TypingAvatars from "./ui/components/TypingAvatars";

let unpatch;
let unpatches = [];

export default {
    onLoad: () => {
        try {
            console.log("[TypingAvatars] Plugin loading...");
            
            // Find the typing wrapper module
            const TypingWrapper = findByProps("TYPING_WRAPPER_HEIGHT");
            
            if (!TypingWrapper) {
                console.error("[TypingAvatars] Failed to find TypingWrapper module. Plugin will not work.");
                return;
            }
            
            console.log("[TypingAvatars] Found TypingWrapper module:", TypingWrapper);

            // Patch the default export
            unpatch = after("default", TypingWrapper, (args, res) => {
                try {
                    if (!res) {
                        console.warn("[TypingAvatars] TypingWrapper returned no result");
                        return;
                    }
                    
                    const Typing = res.props?.children;
                    
                    if (!Typing) {
                        console.warn("[TypingAvatars] No Typing component found in result");
                        return;
                    }

                    const unpatchTyping = after("type", Typing, (_, typingRes) => {
                        try {
                            if (!typingRes) return;
                            
                            React.useEffect(() => () => { 
                                unpatchTyping(); 
                            }, []);
                            
                            // Safely access and replace typing indicator
                            const children = typingRes.props?.children?.[0]?.props?.children;
                            
                            if (Array.isArray(children) && children.length > 0) {
                                const channel = args[0]?.channel;
                                if (channel) {
                                    children.splice(0, 1, <TypingAvatars channel={channel} />);
                                    console.log("[TypingAvatars] Successfully patched typing indicator");
                                }
                            }
                        } catch (innerError) {
                            console.error("[TypingAvatars] Error in typing patch:", innerError);
                        }
                    });
                    
                    unpatches.push(unpatchTyping);
                } catch (wrapperError) {
                    console.error("[TypingAvatars] Error in TypingWrapper patch:", wrapperError);
                }
            });
            
            console.log("[TypingAvatars] Plugin loaded successfully!");
        } catch (error) {
            console.error("[TypingAvatars] Fatal error during plugin load:", error);
        }
    },
    onUnload: () => {
        try {
            console.log("[TypingAvatars] Plugin unloading...");
            
            if (unpatch) {
                unpatch();
                console.log("[TypingAvatars] Main patch removed");
            }
            
            unpatches.forEach((patch, index) => {
                try {
                    patch();
                } catch (e) {
                    console.warn(`[TypingAvatars] Error removing patch ${index}:`, e);
                }
            });
            
            unpatches = [];
            console.log("[TypingAvatars] Plugin unloaded successfully!");
        } catch (error) {
            console.error("[TypingAvatars] Error during plugin unload:", error);
        }
    },
};
