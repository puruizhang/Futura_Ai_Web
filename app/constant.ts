export const OWNER = "";
export const REPO = "";
export const REPO_URL = ``;
export const ISSUE_URL = ``;
export const UPDATE_URL = `${REPO_URL}#keep-updated`;
export const RELEASE_URL = `${REPO_URL}/releases`;
export const FETCH_COMMIT_URL = `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=1`;
export const FETCH_TAG_URL = `https://api.github.com/repos/${OWNER}/${REPO}/tags?per_page=1`;
export const RUNTIME_CONFIG_DOM = "danger-runtime-config";

export const DEFAULT_CORS_HOST = "https://a.nextweb.fun";
export const DEFAULT_API_HOST = `${DEFAULT_CORS_HOST}/api/proxy`;
export const OPENAI_BASE_URL = "https://api.openai.com";

export enum Path {
  Home = "/",
  Chat = "/chat",
  Settings = "/settings",
  BuyPage = "/buy",
  NewChat = "/new-chat",
  Masks = "/masks",
  Auth = "/auth",
  Active = "/active",
}

export enum ApiPath {
  Cors = "/api/cors",
  OpenAI = "/api/openai",
}

export enum SlotID {
  AppBody = "app-body",
  CustomModel = "custom-model",
}

export enum FileName {
  Masks = "masks.json",
  Prompts = "prompts.json",
}

export enum StoreKey {
  Chat = "futura-web-store",
  Access = "access-control",
  Config = "app-config",
  Mask = "mask-store",
  Prompt = "prompt-store",
  Update = "chat-update",
  Sync = "sync",
}

export const DEFAULT_SIDEBAR_WIDTH = 300;
export const MAX_SIDEBAR_WIDTH = 500;
export const MIN_SIDEBAR_WIDTH = 230;
export const NARROW_SIDEBAR_WIDTH = 100;

export const ACCESS_CODE_PREFIX = "nk-";

export const LAST_INPUT_KEY = "last-input";
export const UNFINISHED_INPUT = (id: string) => "unfinished-input-" + id;

export const STORAGE_KEY = "chatgpt-next-web";

export const REQUEST_TIMEOUT_MS = 60000;

export const EXPORT_MESSAGE_CLASS_NAME = "export-markdown";

export enum ServiceProvider {
  OpenAI = "OpenAI",
  Azure = "Azure",
}

export const OpenaiPath = {
  ChatPath: "v1/chat/completions",
  UsagePath: "dashboard/billing/usage",
  SubsPath: "dashboard/billing/subscription",
  ListModelPath: "v1/models",
};

export const Azure = {
  ExampleEndpoint: "https://{resource-url}/openai/deployments/{deploy-id}",
};

export const DEFAULT_INPUT_TEMPLATE = `{{input}}`; // input / time / model / lang
export const DEFAULT_SYSTEM_GPT_TEMPLATE = `
You are ChatGPT, a large language model trained by OpenAI.
Knowledge cutoff: {{cutoff}}
Current model: {{model}}
Current time: {{time}}
Latex inline: $x^2$ 
Latex block: $$e=mc^2$$
`;

export const DEFAULT_SYSTEM_ZP_TEMPLATE = ``;

export const SUMMARIZE_MODEL = "gpt-3.5-turbo";

export const KnowledgeCutOffDate: Record<string, string> = {
  default: "2021-09",
  "gpt-4-1106-preview": "2023-04",
  "gpt-4-vision-preview": "2023-04",
};

export const DEFAULT_MODELS = [
  {
    name: "Futura AI Draw-🎨",
    available: true,
  },


  {
    name: "gpt-3.5-turbo-(极速、联网支持)",
    available: true,
  },
  {
    name: "gpt-3.5-turbo-16k-(极速、联网支持)",
    available: true,
  },
  {
    name: "gpt-4-(极速、联网支持)",
    available: true,
  },
  {
    name: "gpt-4-32k-(极速、联网支持)",
    available: true,
  },
  // {
  //   name: "gpt-4-vision-preview-(极速、联网支持、图片解读)",
  //   available: false,
  // },
  {
    name: "gpt-4-turbo-preview-(极速、联网支持)",
    available: true,
  },

  {
    name: "gemini-pro-(极速、联网支持)",
    available: true,
  },
  {
    name: "gemini-pro-vision-(极速、联网支持)",
    available: true,
  },
  {
    name: "claude-1-100k-(极速、联网支持)",
    available: true,
  },
  {
    name: "claude-1.3-(极速、联网支持)",
    available: true,
  },
  {
    name: "claude-1.3-100k-(极速、联网支持)",
    available: true,
  },
  {
    name: "claude-2-(极速、联网支持)",
    available: true,
  },
  {
    name: "llama-2-70b-(极速、联网支持)",
    available: true,
  },
  {
    name: "llama-2-13b-(极速、联网支持)",
    available: true,
  },
  {
    name: "llama-2-7b-(极速、联网支持)",
    available: true,
  },
  {
    name: "code-llama-34b-(极速、联网支持)",
    available: true,
  },
  {
    name: "code-llama-34b-(极速、联网支持)",
    available: true,
  },
  {
    name: "code-llama-7b-(极速、联网支持)",
    available: true,
  },
  {
    name: "阿里千问-72b-(极速、联网支持)",
    available: true,
  },

  {
    name: "清华智谱-(限免-不支持联网)",
    available: true,
  },
  {
    name: "讯飞星火-(限免-不支持联网)",
    available: true,
  },
  {
    name: "GPT3.5-Turbo-(限免-不支持联网)",
    available: true,
  },
] as const;

export const CHAT_PAGE_SIZE = 15;
export const MAX_RENDER_MSG_COUNT = 45;
