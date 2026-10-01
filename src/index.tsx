import { findByProps, findByName } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import TypingAvatars from "./ui/components/TypingAvatars";

let unpatch;
let unpatches = [];

export default {
    onLoad: () => {
        try {
            console.log("[TypingAvatars] Plugin loading on Discord Revenge...");
            
            // Try multiple ways to find the typing indicator component
            let TypingWrapper = null;
            
            // Method 1: Direct findByProps
            try {
                TypingWrapper = findByProps("TYPING_WRAPPER_HEIGHT");
                console.log("[TypingAvatars] Found TypingWrapper via findByProps");
            } catch (e) {
                console.warn("[TypingAvatars] findByProps failed, trying findByName...");
            }
            
            // Method 2: Try finding by name if Method 1 failed
            if (!TypingWrapper) {
                try {
                    TypingWrapper = findByName("TypingIndicator", false);
                    console.log("[TypingAvatars] Found TypingWrapper via findByName");
                } catch (e) {
                    console.warn("[TypingAvatars] findByName failed");
                }
            }
            
            // Method 3: Try finding by props with Typing keyword
            if (!TypingWrapper) {
                try {
                    TypingWrapper = findByProps("Typing");
                    console.log("[TypingAvatars] Found TypingWrapper via 'Typing' props");
                } catch (e) {
                    console.warn("[TypingAvatars] 'Typing' props search failed");
                }
            }
            
            if (!TypingWrapper) {
                console.error("[TypingAvatars] Failed to find TypingWrapper module with any method. Plugin cannot load.");
                console.error("[TypingAvatars] This may indicate Discord Revenge API changed or plugin is incompatible.");
                return;
            }
            
            console.log("[TypingAvatars] TypingWrapper module found:", TypingWrapper);

            // Patch the component
            if (TypingWrapper.default) {
                unpatch = after("default", TypingWrapper, (args, res) => {
                    handleTypingPatch(args, res);
                });
                console.log("[TypingAvatars] Patched TypingWrapper.default");
            } else if (typeof TypingWrapper === 'function') {
                unpatch = after("default", { default: TypingWrapper }, (args, res) => {
                    handleTypingPatch(args, res);
                });
                console.log("[TypingAvatars] Patched as function");
            } else {
                // Try patching the render method
                for (let key in TypingWrapper) {
                    if (typeof TypingWrapper[key] === 'function') {
                        const patchUnpatch = after(key, TypingWrapper, (args, res) => {
                            handleTypingPatch(args, res);
                        });
                        unpatches.push(patchUnpatch);
                        console.log(`[TypingAvatars] Patched method: ${key}`);
                        break;
                    }
                }
            }
            
            console.log("[TypingAvatars] Plugin loaded successfully!");
        } catch (error) {
            console.error("[TypingAvatars] Fatal error during plugin load:", error);
            console.error("[TypingAvatars] Stack:", error.stack);
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

function handleTypingPatch(args, res) {
    try {
        if (!res) {
            console.warn("[TypingAvatars] Result is null/undefined");
            return;
        }
        
        console.log("[TypingAvatars] Patch called, attempting to modify component");
        
        // Try to access the typing component in different ways
        const children = res.props?.children;
        
        if (!children) {
            console.warn("[TypingAvatars] No children found in result");
            return;
        }
        
        // Handle array of children
        if (Array.isArray(children)) {
            const channel = args[0]?.channel || args[1]?.channel;
            if (channel && children.length > 0) {
                children[0] = <TypingAvatars channel={channel} />;
                console.log("[TypingAvatars] Successfully replaced first child with TypingAvatars");
                return;
            }
        }
        
        // Try accessing nested structure
        if (children?.props?.children) {
            const channel = args[0]?.channel || args[1]?.channel;
            if (channel) {
                const nestedChildren = children.props.children;
                if (Array.isArray(nestedChildren) && nestedChildren.length > 0) {
                    nestedChildren[0] = <TypingAvatars channel={channel} />;
                    console.log("[TypingAvatars] Successfully replaced nested child");
                    return;
                }
            }
        }
        
        console.warn("[TypingAvatars] Could not find appropriate place to inject TypingAvatars component");
    } catch (error) {
        console.error("[TypingAvatars] Error in handleTypingPatch:", error);
        console.error("[TypingAvatars] Error stack:", error.stack);
    }
}
