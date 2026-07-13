import { patcher, metro, storage, components } from "@vendetta";
const { Forms } = components;
const FluxDispatcher = metro.common.FluxDispatcher;

storage.targetMessageId ??= "1520914436460904678";
storage.spoofedText ??= "";
storage.spoofedDisplayName ??= ".𝚔𝚊𝐳𝚏𝚕𝐚";
storage.spoofedAvatar ??= "https://cdn.discordapp.com/avatars/758731615265357824/d58a1012427825b24816247844152b6a.png";

let patches = [];

function applyMobileSpoof(messageObj) {
    if (!messageObj) return;
    Object.defineProperty(messageObj, "content", { get: () => storage.spoofedText, set: () => {}, configurable: true });
    if (messageObj.author) {
        Object.defineProperty(messageObj.author, "username", { get: () => storage.spoofedDisplayName, configurable: true });
        Object.defineProperty(messageObj.author, "globalName", { get: () => storage.spoofedDisplayName, configurable: true });
        Object.defineProperty(messageObj.author, "avatar", { get: () => "spoofed", configurable: true });
    }
}

export default {
    onLoad: () => {
        patches.push(patcher.before("dispatch", FluxDispatcher, (args) => {
            const [payload] = args;
            if ((payload.type === "LOAD_MESSAGES_SUCCESS" || payload.type === "LOCAL_MESSAGE_CREATE") && payload.messages) {
                const target = payload.messages.find(m => m?.id === storage.targetMessageId);
                if (target) applyMobileSpoof(target);
            }
        }));
        const RowManager = metro.findByProps("prototype", "generate");
        if (RowManager?.prototype) {
            patches.push(patcher.after("generate", RowManager.prototype, (args, ret) => {
                if (ret?.message?.id === storage.targetMessageId) applyMobileSpoof(ret.message);
            }));
        }
    },
    onUnload: () => patches.forEach(p => p())
};

export const settings = () => (
    <Forms.FormSection title="Spoof Settings">
        <Forms.FormTextInput title="Target Message ID" value={storage.targetMessageId} onChange={(v) => storage.targetMessageId = v} />
        <Forms.FormTextInput title="Spoofed Display Name" value={storage.spoofedDisplayName} onChange={(v) => storage.spoofedDisplayName = v} />
        <Forms.FormTextInput title="Spoofed Text Content" value={storage.spoofedText} onChange={(v) => storage.spoofedText = v} />
        <Forms.FormTextInput title="Avatar URL" value={storage.spoofedAvatar} onChange={(v) => storage.spoofedAvatar = v} />
    </Forms.FormSection>
);