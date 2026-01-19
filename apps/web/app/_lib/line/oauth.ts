import "server-only";
import { requireEnv } from "../env";

export function getLineRedirectUri(): string {
  return requireEnv("LINE_REDIRECT_URI");
}
