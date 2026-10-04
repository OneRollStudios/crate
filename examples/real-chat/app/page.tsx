import { Chat } from "./chat";
import { model, isMock } from "./mode";

// Read on each request, so changing .env.local only needs a restart.
export const dynamic = "force-dynamic";

export default function Page() {
  return <Chat mock={isMock()} model={model} />;
}
