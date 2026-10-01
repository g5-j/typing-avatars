import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import TypingAvatars from "./ui/components/TypingAvatars";

const TypingWrapper = findByProps("TYPING_WRAPPER_HEIGHT");

let unpatch;

export default {
    onLoad: () => {
        try {
            unpatch = after("default", TypingWrapper, ([{ channel }], res) => {
                if (!res) return;
                const Typing = res.props?.children;

                const unpatchTyping = after("type", Typing, (_, res) => {
                    React.useEffect(() => () => { unpatchTyping() }, []);
                    // Handle both Discord 345.9+ and Discord Revenge 1.3.0+ typing indicator structure
                    if (res.props?.children?.[0]?.props?.children) {
                        res.props.children[0].props.children.splice(0, 1, <TypingAvatars channel={channel} />);
                    }
                });
            });
        } catch (error) {
            console.error("[TypingAvatars] Failed to patch typing wrapper:", error);
        }
    },
    onUnload: () => {
        if (unpatch) {
            unpatch();
        }
    },
};
